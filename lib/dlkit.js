/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Pabrik command downloader: validasi link, cooldown, lock per-user, unduh aman (batas ukuran + cek MIME),
// gabung video+audio terpisah (Reddit) dengan ffmpeg, lalu kirim sebagai video / foto / audio / dokumen.
//   export default socialDownloader({ names, title, desc, domains, example, scrape })
// scrape(url) harus mengembalikan hasil dari lib/scrape/dlcommon.js (buildResult).
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import config from '../config.js'
import { cmd, react } from './plugkit.js'
import { pfxOf, box } from './format.js'
import { ApiError, downloadBuffer, formatBytes } from './api.js'
import { checkCooldown, resetCooldown, acquireLock, releaseLock } from './cooldown.js'
import { toAudio } from './converter.js'
import { hostMatches } from './scrape/dlcommon.js'

const MB = 1024 * 1024
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const MAX_VIDEOS = 3

const sleep = ms => new Promise(r => setTimeout(r, ms))
const safeName = s => String(s || '').replace(/[\\/:*?"<>|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

// Pesan error ramah untuk pengguna (tidak pernah menampilkan stack trace / key).
export const friendly = (e) => {
    if (e instanceof ApiError || e?.name === 'DlError') return clip(e.message, 300)
    return `Terjadi kesalahan: ${clip(String(e?.message || e).split('\n')[0], 160)}`
}

// Gabungkan video-only + audio-only menjadi satu MP4. Mengembalikan null kalau ffmpeg tidak tersedia / gagal.
async function mergeAV(videoBuf, audioBuf) {
    const dir = await mkdtemp(join(tmpdir(), 'sakura-dl-'))
    const v = join(dir, 'v.mp4'), a = join(dir, 'a.mp4'), out = join(dir, 'out.mp4')
    try {
        await writeFile(v, videoBuf)
        await writeFile(a, audioBuf)
        await new Promise((resolve, reject) => {
            const child = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', v, '-i', a, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out], { stdio: 'ignore' })
            const timer = setTimeout(() => { try { child.kill('SIGKILL') } catch {} reject(new Error('ffmpeg timeout')) }, 120000)
            child.on('error', e => { clearTimeout(timer); reject(e) })
            child.on('close', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)) })
        })
        return await readFile(out)
    } catch (e) {
        console.error('[dlkit] merge gagal:', e?.message || e)
        return null
    } finally {
        rm(dir, { recursive: true, force: true }).catch(() => {})
    }
}

// Unduh satu item media; coba url utama lalu cadangan (alts) sampai ada yang berhasil.
async function fetchItem(item) {
    let lastErr = null
    for (const url of [item.url, ...(item.alts || [])]) {
        try {
            const file = await downloadBuffer(url, { headers: item.headers || {} })
            if (file.size < 1000) throw new ApiError('File hasil download terlalu kecil / kosong.', { code: 'EMPTY_FILE' })
            return file
        } catch (e) {
            lastErr = e
        }
    }
    throw lastErr || new ApiError('Gagal mengunduh media.', { code: 'DOWNLOAD_FAILED' })
}

async function sendFile(conn, m, file, caption, name, note) {
    const text = [caption, note].filter(Boolean).join('\n')
    const { buffer, mime } = file
    const maxVideo = (config.limits?.maxVideoMB ?? 50) * MB

    if (mime.startsWith('video/')) {
        // Video besar dikirim sebagai dokumen supaya tidak ditolak WhatsApp
        if (buffer.length > maxVideo) {
            return conn.sendMessage(m.chat, { document: buffer, mimetype: 'video/mp4', fileName: `${name}.mp4`, caption: text }, { quoted: m })
        }
        return conn.sendMessage(m.chat, { video: buffer, caption: text, mimetype: 'video/mp4' }, { quoted: m })
    }
    if (mime.startsWith('image/')) return conn.sendMessage(m.chat, { image: buffer, caption: text }, { quoted: m })
    if (mime.startsWith('audio/')) {
        if (text) await conn.sendMessage(m.chat, { text }, { quoted: m }).catch(() => {})
        let out = buffer, outMime = mime
        if (mime !== 'audio/mpeg') {
            try { out = await toAudio(buffer, file.ext || 'm4a'); outMime = 'audio/mpeg' } catch {}
        }
        return conn.sendMessage(m.chat, { audio: out, mimetype: outMime, fileName: `${name}.${outMime === 'audio/mpeg' ? 'mp3' : file.ext || 'm4a'}` }, { quoted: m })
    }
    return conn.sendMessage(m.chat, { document: buffer, mimetype: mime, fileName: `${name}${file.ext ? '.' + file.ext : ''}`, caption: text }, { quoted: m })
}

const buildCaption = (result, first, size) => [
    `✅ *${result.platform}*`,
    result.title && `📝 ${clip(result.title, 200)}`,
    result.author && `👤 ${clip(result.author, 60)}`,
    result.duration && `⏱️ ${result.duration}`,
    ...(result.extra || []),
    first.quality && `🎞️ ${first.quality}`,
    `📦 ${formatBytes(size)}`
].filter(Boolean).join('\n')

export function socialDownloader({ names, title, desc, domains = [], example, scrape, maxItems = 10, allowQuery = false }) {
    return cmd({ command: names, desc, tags: ['downloader'], download: true, title }, async (m, { conn, text, prefix, notifReply }) => {
        const raw = String(text || m.quoted?.text || '').trim()
        const link = raw.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[)\].,;!?]+$/, '')
        const input = link || (allowQuery ? raw : '')
        if (!input) return notifReply(`Contoh:\n${pfxOf(prefix)}${names[0]} ${example}`, title)
        if (link && domains.length && !hostMatches(link, domains)) return notifReply(`Link tidak valid untuk ${title}.\nContoh: ${example}`, title)

        const key = `dl:${m.sender}`
        if (!m.isOwner) {
            const cd = checkCooldown(key, config.limits?.cooldown?.download ?? 10)
            if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum download lagi.`, title)
        }
        if (!acquireLock(key)) return notifReply('Masih ada proses download yang berjalan.', title)

        try {
            await react(conn, m, '⏳')
            const result = await scrape(input)
            const stamp = Date.now()
            let sent = 0, videos = 0, lastErr = null, firstSize = 0

            for (const item of result.media) {
                if (sent >= maxItems) break
                if (item.type === 'video' && videos >= MAX_VIDEOS) continue
                try {
                    let file = await fetchItem(item)
                    let note = ''
                    if (item.audioUrl && file.mime.startsWith('video/')) {
                        try {
                            const audio = await downloadBuffer(item.audioUrl, { headers: item.headers || {} })
                            const merged = await mergeAV(file.buffer, audio.buffer)
                            if (merged) file = { ...file, buffer: merged, size: merged.length, mime: 'video/mp4', ext: 'mp4' }
                            else note = '⚠️ Suara tidak bisa digabung (ffmpeg tidak tersedia), video dikirim tanpa suara.'
                        } catch (e) {
                            note = '⚠️ Suara tidak bisa diunduh, video dikirim tanpa suara.'
                        }
                    }
                    const caption = sent === 0 ? buildCaption(result, item, file.size) : ''
                    const base = safeName(result.title) || `${names[0]}-${stamp}`
                    await sendFile(conn, m, file, caption, sent ? `${base}-${sent + 1}` : base, sent === 0 ? note : '')
                    if (sent === 0) firstSize = file.size
                    sent++
                    if (item.type === 'video') videos++
                    if (result.media.length > 1) await sleep(600)
                } catch (e) {
                    lastErr = e
                }
            }
            if (!sent) throw lastErr || new ApiError('Gagal mengunduh media.', { code: 'DOWNLOAD_FAILED' })
            await react(conn, m, '✅')
        } catch (e) {
            console.error(`[${names[0]}] error:`, e?.message || e)
            if (!m.isOwner) resetCooldown(key) // gagal tidak boleh menghukum user dengan cooldown
            await react(conn, m, '❌')
            await notifReply(box('❌ GAGAL', [`Download ${title} gagal.`, '', `Detail: ${friendly(e)}`]), title)
        } finally {
            releaseLock(key)
        }
    })
}
