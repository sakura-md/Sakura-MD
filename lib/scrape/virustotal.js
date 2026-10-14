/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// VirusTotal lewat browser headless (puppeteer-extra + stealth): halaman GUI dibuka lalu respon
// /ui/files/<hash> atau /ui/urls/<id> diambil. Tidak butuh API key. Hanya LOOKUP (tidak mengunggah file).
// Butuh paket: puppeteer, puppeteer-extra, puppeteer-extra-plugin-stealth, serta Chromium
// (set CHROMIUM_PATH / config.chromiumPath kalau tidak memakai Chromium bawaan puppeteer).
import fs from 'node:fs'
import config from '../../config.js'
import { ApiError } from '../api.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const HASH = /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i
const TERMUX_CHROMIUM = '/data/data/com.termux/files/usr/bin/chromium-browser'

export const isHash = (s) => HASH.test(String(s || '').trim())

// Kembalikan { type: 'file'|'url', target, urlId? } atau null kalau input tidak valid
export function parseTarget(input) {
    const s = String(input || '').trim()
    if (!s) return null
    if (isHash(s)) return { type: 'file', target: s.toLowerCase() }
    let url = s
    if (!/^https?:\/\//i.test(url)) url = `http://${url}`
    try {
        const u = new URL(url)
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null
        return { type: 'url', target: u.href, urlId: Buffer.from(u.href).toString('base64url') }
    } catch { return null }
}

const chromePath = () => {
    const p = process.env.CHROMIUM_PATH || config.chromiumPath
    if (p) return p
    return fs.existsSync(TERMUX_CHROMIUM) ? TERMUX_CHROMIUM : undefined
}

let busy = false
export const vtBusy = () => busy

async function loadPuppeteer() {
    try {
        const [{ default: puppeteer }, { default: Stealth }] = await Promise.all([
            import('puppeteer-extra'),
            import('puppeteer-extra-plugin-stealth')
        ])
        puppeteer.use(Stealth())
        return puppeteer
    } catch {
        throw new ApiError('Modul browser belum terpasang. Jalankan: npm i puppeteer puppeteer-extra puppeteer-extra-plugin-stealth', { code: 'NO_DEP' })
    }
}

async function fetchRaw({ type, target, urlId }, timeoutMs = 45000) {
    const puppeteer = await loadPuppeteer()
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    try {
        const page = await browser.newPage()
        await page.setUserAgent(UA)

        let resolveData
        const got = new Promise(r => { resolveData = r })

        page.on('response', async (res) => {
            try {
                const parts = new URL(res.url()).pathname.split('/')
                const last = parts[parts.length - 1]
                const prev = parts[parts.length - 2]
                const isMain = type === 'file' ? (prev === 'files' && last.toLowerCase() === target) : prev === 'urls'
                if (!isMain || res.request().method() !== 'GET') return
                const json = JSON.parse(await res.text())
                if (res.status() === 404 && json.error) return resolveData({ error: `VirusTotal: ${json.error.message || json.error.code}` })
                if (res.status() === 200 && json.data?.attributes) resolveData(json)
            } catch { /* abaikan respon yang bukan target */ }
        })

        const gui = type === 'url'
            ? `https://www.virustotal.com/gui/url/${urlId}/detection`
            : `https://www.virustotal.com/gui/file/${target}/detection`
        await page.goto(gui, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})

        const data = await Promise.race([got, new Promise(r => setTimeout(() => r({ error: 'Timeout menunggu VirusTotal (kemungkinan diblokir Cloudflare atau data belum ada).' }), timeoutMs))])
        if (data.error) throw new ApiError(data.error, { code: 'VT_FAILED' })
        return data
    } finally {
        await browser.close().catch(() => {})
    }
}

// Hasil ringkas siap tampil
export async function lookup(input) {
    const t = typeof input === 'string' ? parseTarget(input) : input
    if (!t) throw new ApiError('Masukkan hash (MD5/SHA-1/SHA-256) atau URL yang valid.', { code: 'BAD_INPUT' })
    if (busy) throw new ApiError('Pengecekan VirusTotal lain sedang berjalan, coba lagi sebentar.', { code: 'VT_BUSY' })
    busy = true
    try {
        const json = await fetchRaw(t)
        const a = json.data.attributes
        const stats = a.last_analysis_stats || {}
        const results = a.last_analysis_results || {}
        const flagged = (cat) => Object.values(results).filter(r => r.category === cat).map(r => ({ engine: r.engine_name, result: r.result || '-' }))
        const total = (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0)
        return {
            type: t.type,
            stats: { malicious: stats.malicious || 0, suspicious: stats.suspicious || 0, harmless: stats.harmless || 0, undetected: stats.undetected || 0, total },
            malicious: flagged('malicious'),
            suspicious: flagged('suspicious'),
            reputation: a.reputation ?? 0,
            tags: a.tags || [],
            timesSubmitted: a.times_submitted,
            firstSubmission: a.first_submission_date ? new Date(a.first_submission_date * 1000) : null,
            lastAnalysis: a.last_analysis_date ? new Date(a.last_analysis_date * 1000) : null,
            file: t.type === 'file' ? {
                name: a.meaningful_name || a.names?.[0] || '-', size: a.size, kind: a.type_description,
                md5: a.md5, sha1: a.sha1, sha256: a.sha256
            } : null,
            url: t.type === 'url' ? {
                url: a.url, title: a.title, finalUrl: a.last_final_url, httpCode: a.last_http_response_code,
                categories: [...new Set(Object.values(a.categories || {}))]
            } : null
        }
    } finally { busy = false }
}
