/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// OFA (oneforalldownloader.com): preview -> antrean -> tunggu socket.io "completed" -> link file.
// Mendukung banyak situs (yt-dlp di sisi server). socket.io-client dimuat saat dibutuhkan saja.
import { buildResult, DlError, isUrl, UA_DESKTOP } from './dlcommon.js'

const BASE = 'https://oneforalldownloader.com'
const AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'wav', 'flac']
const WAIT_MS = 180000

export const OFA_DOMAINS = [] // OFA menerima banyak situs, jadi tidak dibatasi domain

const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': UA_DESKTOP
}

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new DlError(`OFA ${path} gagal (HTTP ${res.status})`, 'OFA_HTTP')
    return res.json()
}

const fmtDuration = (s) => {
    const n = Number(s) || 0
    return n ? `${Math.floor(n / 60)}m ${n % 60}s` : ''
}

// Tunggu event "completed" untuk uuid tertentu. Mengembalikan { filename, quality, config }.
async function waitCompleted(uuid) {
    let io
    try { ({ io } = await import('socket.io-client')) } catch {
        throw new DlError('Modul socket.io-client belum terpasang. Jalankan: npm i socket.io-client', 'NO_DEP')
    }
    return new Promise((resolve, reject) => {
        const socket = io(BASE, { path: '/socket.io', transports: ['polling'], reconnection: false })
        const cfg = { URL_PREFIX: '/', PUBLIC_HOST_URL: 'download/', PUBLIC_HOST_AUDIO_URL: 'audio_download/' }
        let settled = false
        const finish = (fn, value) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            try { socket.disconnect() } catch {}
            fn(value)
        }
        const timer = setTimeout(() => finish(reject, new DlError('OFA: proses terlalu lama (timeout).', 'OFA_TIMEOUT')), WAIT_MS)
        const parse = (raw) => { try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null } }

        socket.on('connect', () => socket.emit('subscribe', { uuid }))
        socket.on('connect_error', (e) => finish(reject, new DlError(`OFA: koneksi status gagal (${e.message})`, 'OFA_SOCKET')))
        socket.on('configuration', (raw) => {
            const p = parse(raw)
            if (p) Object.assign(cfg, Object.fromEntries(Object.entries(p).filter(([k, v]) => k in cfg && v)))
        })
        socket.on('updated', (raw) => {
            const u = parse(raw)
            if (u?.uuid === uuid && /error|fail/i.test(String(u.status || ''))) finish(reject, new DlError(`OFA: ${u.msg || u.status}`, 'OFA_FAILED'))
        })
        socket.on('completed', (raw) => {
            const c = parse(raw)
            if (c?.uuid === uuid) finish(resolve, { ...c, cfg })
        })
    })
}

// quality: 'any' | 360 | 720 | ...   format: 'any' | 'mp4' | 'webm' | 'mp3' | 'm4a' | ...
export async function getOfaMedia(input, { quality = 'any', format = 'any' } = {}) {
    const url = String(input || '').trim()
    if (!isUrl(url)) throw new DlError('Masukkan link video/audio yang valid.', 'BAD_URL')

    const preview = await post('/preview', { url, playlist_item_limit: 50 })
    if (preview.status === 'error') throw new DlError(`OFA: ${preview.msg || 'link tidak didukung'}`, 'OFA_PREVIEW')
    const { uuid, title, duration } = preview
    if (!uuid) throw new DlError('OFA: respon preview tidak lengkap.', 'OFA_PREVIEW')

    const isAudio = AUDIO_FORMATS.includes(format)
    const q = isAudio ? 'any' : (quality === 'any' ? 'any' : Number(quality) || 'any')
    const added = await post('/add', {
        url, quality: q, format, folder: '', custom_name_prefix: '', playlist_strict_mode: false,
        playlist_item_limit: 50, uuid, preview_info: preview
    })
    if (added.status !== 'ok') throw new DlError(`OFA: gagal masuk antrean (${added.msg || added.status})`, 'OFA_QUEUE')

    const done = await waitCompleted(uuid)
    const audioOut = isAudio || done.quality === 'audio' || /\.(mp3|m4a|opus|wav|flac)$/i.test(done.filename || '')
    const prefix = done.cfg.URL_PREFIX.startsWith('/') ? BASE + done.cfg.URL_PREFIX : done.cfg.URL_PREFIX
    const fileUrl = `${prefix}${audioOut ? done.cfg.PUBLIC_HOST_AUDIO_URL : done.cfg.PUBLIC_HOST_URL}${encodeURIComponent(done.filename)}`

    return buildResult({
        platform: 'OFA Downloader',
        source: 'oneforalldownloader.com',
        title,
        duration: fmtDuration(duration),
        media: [{ type: audioOut ? 'audio' : 'video', url: fileUrl, quality: audioOut ? format : (done.quality || '') }]
    })
}
