/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Helper bersama untuk scraper downloader (instagramdl, facebookdl, twitterdl, dst).
// Semua scraper mengembalikan bentuk hasil yang sama:
//   { platform, source, title, author, thumbnail, duration, media: [{ type, url, quality?, audioUrl? }] }
//   type = 'video' | 'image' | 'audio'. audioUrl dipakai kalau video & audio terpisah (Reddit) -> digabung ffmpeg.
import axios from 'axios'
import { sakuraRequest } from '../api.js'
import { extractFromApi, infoLines } from './dlextract.js'
export { extractFromApi, infoLines }

export const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
export const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'

export class DlError extends Error {
    constructor(message, code = 'DL_ERROR') {
        super(message)
        this.name = 'DlError'
        this.code = code
    }
}

export const isUrl = v => typeof v === 'string' && /^https?:\/\//i.test(v.trim())

export const uniq = list => [...new Set(list.filter(Boolean))]

export function hostMatches(url, domains) {
    try {
        const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
        return domains.some(d => h === d || h.endsWith(`.${d}`))
    } catch {
        return false
    }
}

// Ambil teks bersih dari string JSON-escaped ("\u0026", "\/", "\"").
export function unescapeJsonString(str = '') {
    try {
        return JSON.parse(`"${String(str).replace(/"/g, '\\"').replace(/\\\\"/g, '\\"')}"`)
    } catch {
        return String(str)
            .replace(/\\u0026/g, '&')
            .replace(/\\u002F/gi, '/')
            .replace(/\\\//g, '/')
    }
}

export function decodeHtml(str = '') {
    return String(str)
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x2F;/gi, '/')
}

// GET dengan UA browser, tidak melempar error untuk status HTTP; pemanggil yang menilai.
export async function httpGet(url, { mobile = false, headers = {}, timeout = 25000, json = false, params } = {}) {
    const res = await axios.get(url, {
        params,
        timeout,
        maxRedirects: 8,
        responseType: json ? 'json' : 'text',
        transformResponse: json ? undefined : [d => d],
        validateStatus: () => true,
        headers: {
            'User-Agent': mobile ? UA_MOBILE : UA_DESKTOP,
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: json ? 'application/json,*/*' : 'text/html,application/xhtml+xml,*/*',
            ...headers
        }
    })
    return {
        status: res.status,
        data: res.data,
        finalUrl: res.request?.res?.responseUrl || url
    }
}

// Ikuti redirect link pendek (vt.tiktok, pin.it, fb.watch, l.likee.video, dst) -> URL akhir.
export async function resolveUrl(url, opts = {}) {
    try {
        const r = await httpGet(url, { ...opts, timeout: 15000 })
        return r.finalUrl || url
    } catch {
        return url
    }
}

export function metaContent(html = '', prop) {
    const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'))
    const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`, 'i'))
    const v = (a || b)?.[1]
    return v ? decodeHtml(v) : ''
}

export function pageTitle(html = '') {
    return decodeHtml(metaContent(html, 'og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim()
}

// Kumpulkan semua JSON dalam <script type="application/json|ld+json"> (aman terhadap JSON rusak).
export function scriptJsons(html = '') {
    const out = []
    const re = /<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi
    let m
    while ((m = re.exec(html))) {
        try { out.push(JSON.parse(m[1])) } catch {}
    }
    return out
}

// Susun hasil standar + validasi: minimal harus ada satu media.
export function buildResult({ platform, source, title = '', author = '', thumbnail = '', duration = '', extra = [], media = [] }) {
    const seen = new Set()
    const clean = media.filter(item => {
        if (!item || !isUrl(item.url) || seen.has(item.url)) return false
        seen.add(item.url)
        return true
    }).map(item => ({ ...item, url: item.url.trim() }))
    if (!clean.length) throw new DlError(`${source}: tidak ada link media di respon`, 'NO_MEDIA')
    return { platform, source, title: String(title || '').trim(), author: String(author || '').trim(), thumbnail, duration, extra, media: clean }
}

// Jalankan beberapa sumber berurutan; yang pertama berhasil dipakai. Error semua sumber digabung.
export async function runProviders(platform, providers, url) {
    const errors = []
    for (const run of providers) {
        try {
            return await run(url)
        } catch (e) {
            const msg = e?.response?.status ? `HTTP ${e.response.status}` : (e?.message || String(e))
            errors.push(String(msg).split('\n')[0].slice(0, 140))
        }
    }
    throw new DlError(`Semua sumber ${platform} gagal -> ${errors.join(' | ')}`, 'ALL_FAILED')
}

// Provider API Sakura: GET {baseUrl}{endpoint}?url=...&apikey=...  (baseUrl & apikey dari config.js -> api).
// Endpoint diisi di tiap file scraper (const ENDPOINT).
//   opts.kind        'video' | 'audio' | 'file'   jenis media utama endpoint
//   opts.param       'url' (default) atau 'query' (endpoint pencarian: dikirim sebagai query + q)
//   opts.maxQuality  batas kualitas video (default 720)
//   opts.describe    fungsi (obj) => [baris info] untuk caption
export function viaSakura(platform, endpoint, opts = {}) {
    const { kind = 'video', param = 'url', maxQuality = 720, describe = null } = opts
    return async (input) => {
        const params = param === 'query' ? { query: input, q: input } : { [param]: input }
        const data = await sakuraRequest(endpoint, params, { retries: 1 })
        if (data?.binary) throw new DlError('API mengembalikan file langsung (bukan JSON)', 'UNSUPPORTED')
        const parsed = extractFromApi(data, { kind, maxQuality, describe })
        return buildResult({ platform, source: `sakura${endpoint.replace(/^.*downloader/, '')}`, ...parsed })
    }
}
