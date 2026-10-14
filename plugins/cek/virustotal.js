/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import crypto from 'node:crypto'
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { formatBytes } from '../../lib/api.js'
import { checkCooldown, resetCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { findMedia, tooBig } from '../../lib/media.js'
import { lookup, parseTarget } from '../../lib/scrape/virustotal.js'

const TITLE = 'VirusTotal'
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)
const when = (d) => d ? d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'

function render(r) {
    const { stats } = r
    const verdict = stats.malicious > 0 ? `🚨 BERBAHAYA (${stats.malicious}/${stats.total} engine)` : stats.suspicious > 0 ? `⚠️ MENCURIGAKAN (${stats.suspicious}/${stats.total} engine)` : `✅ Bersih (0/${stats.total} engine)`
    const lines = [
        verdict,
        `Malicious : ${stats.malicious}`,
        `Suspicious: ${stats.suspicious}`,
        `Harmless  : ${stats.harmless}`,
        `Undetected: ${stats.undetected}`,
        `Reputasi  : ${r.reputation}`,
        ''
    ]
    if (r.file) lines.push(`Nama   : ${clip(r.file.name, 50)}`, `Tipe   : ${clip(r.file.kind, 40)}`, `Ukuran : ${r.file.size ? formatBytes(r.file.size) : '-'}`, `SHA-256: ${r.file.sha256}`)
    if (r.url) lines.push(`URL    : ${clip(r.url.url, 80)}`, r.url.title && `Judul  : ${clip(r.url.title, 60)}`, r.url.httpCode && `HTTP   : ${r.url.httpCode}`, r.url.categories.length && `Kategori: ${clip(r.url.categories.join(', '), 80)}`)
    lines.push(`Pertama dikirim: ${when(r.firstSubmission)}`, `Analisis terakhir: ${when(r.lastAnalysis)}`)
    if (r.tags.length) lines.push(`Tag    : ${clip(r.tags.join(', '), 80)}`)
    const bad = [...r.malicious, ...r.suspicious].slice(0, 12)
    if (bad.length) lines.push('', 'Terdeteksi oleh:', ...bad.map(b => `• ${clip(b.engine, 18)} → ${clip(b.result, 32)}`))
    return box('VIRUSTOTAL', lines)
}

// .virustotal <hash | url>   atau reply file lalu ketik .virustotal (dicek lewat hash SHA-256 file)
const virustotal = cmd({ command: ['virustotal', 'vt', 'cekvirus'], desc: 'Cek hash / URL / file di VirusTotal', tags: ['cek'], title: TITLE }, async (m, { conn, text, prefix, notifReply }) => {
    const pfx = pfxOf(prefix)
    let target = parseTarget(text.trim().split(/\s+/)[0])

    if (!target) {
        const media = findMedia(m, ['document', 'image', 'video', 'audio'])
        if (media) {
            const maxMB = config.limits?.maxDownloadMB ?? 100
            if (tooBig(media, maxMB)) return notifReply(`File terlalu besar (maks ${maxMB} MB).`, TITLE)
            const buf = await media.download()
            target = { type: 'file', target: crypto.createHash('sha256').update(buf).digest('hex') }
        }
    }
    if (!target) return notifReply(`Contoh:\n${pfx}virustotal 275a021bbfb6489e54d471899f7db9d16bba4a0426c69f04dce4076547f01e31\n${pfx}virustotal https://contoh.com\n\nAtau reply sebuah file lalu ketik ${pfx}virustotal\n(file dicek lewat hash-nya, isi file tidak diunggah).`, TITLE)

    const key = `vt:${m.sender}`
    if (!m.isOwner) {
        const cd = checkCooldown(key, config.limits?.cooldown?.virustotal ?? 30)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    }
    if (!acquireLock(key)) return notifReply('Pengecekan sebelumnya masih berjalan.', TITLE)
    try {
        await react(conn, m, '⏳')
        await notifReply('🔍 Mengecek di VirusTotal, tunggu sebentar...', TITLE)
        const r = await lookup(target)
        await notifReply(render(r), TITLE)
        await react(conn, m, '✅')
    } catch (e) {
        if (!m.isOwner) resetCooldown(key)
        await react(conn, m, '❌')
        const hint = target.type === 'file' ? '\n\nFile ini mungkin belum pernah dianalisis di VirusTotal.' : ''
        await notifReply(box('❌ GAGAL', ['Pengecekan gagal.', '', `Detail: ${clip(String(e?.message || e).split('\n')[0], 160)}${hint}`]), TITLE)
    } finally { releaseLock(key) }
})

export default virustotal
