/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { ApiError, downloadBuffer, firstString } from '../../lib/api.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { toAudio } from '../../lib/converter.js'
import { getTikTokMedia, downloadFirst } from '../../lib/scrape/tiktokdl.js'

// TikTok MP3. Downloader lain (Instagram, Facebook, X, YouTube, Spotify, Mega, dst) ada di
// plugins/downloader/*.js + lib/scrape/*dl.js.

const hostMatches = (url, domains) => {
    try {
        const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
        return domains.some(d => h === d || h.endsWith(`.${d}`))
    } catch { return false }
}

const tiktokmp3 = cmd({ command: ['tiktokmp3', 'ttmp3', 'tiktokaudio'], desc: 'Ambil audio dari video TikTok', tags: ['downloader'], download: true, title: 'TikTok MP3' }, async (m, { conn, text, prefix, notifReply }) => {
    const url = text.trim().split(/\s+/)[0]
    if (!url) return notifReply(`Contoh:\n${pfxOf(prefix)}tiktokmp3 https://vt.tiktok.com/xxxx`, 'TikTok MP3')
    if (!hostMatches(url, ['tiktok.com'])) return notifReply('Link TikTok tidak valid.', 'TikTok MP3')
    if (!m.isOwner) {
        const cd = checkCooldown(`dl:${m.sender}`, config.limits?.cooldown?.download ?? 10)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum download lagi.`, 'TikTok MP3')
    }
    const lock = `dl:${m.sender}`
    if (!acquireLock(lock)) return notifReply('Masih ada proses download yang berjalan.', 'TikTok MP3')
    try {
        await react(conn, m, '⏳')
        await notifReply('⏳ Processing...\nSakura-MD sedang memproses media kamu.', 'TikTok MP3')
        // Sumber sama dengan plugin tiktok.js (api-faa.my.id, cadangan tikwm.com)
        const r = await getTikTokMedia(url)
        if (r.images.length && !r.videos.length) throw new ApiError('Postingan ini berupa foto/slideshow, tidak ada audio video untuk diambil.', { code: 'NO_AUDIO' })

        const title = firstString(r.audioTitle, r.title, 'tiktok-audio')
        let mp3
        if (r.audio) {
            const f = await downloadBuffer(r.audio)
            mp3 = f.mime === 'audio/mpeg' ? f.buffer : await toAudio(f.buffer, f.ext || 'm4a')
        } else {
            // Tidak ada link audio di respon -> ekstrak dari video dengan ffmpeg
            if (!r.videos.length) throw new ApiError('API tidak mengembalikan link video/audio.', { code: 'NO_MEDIA' })
            const f = await downloadFirst(r.videos, { maxBytes: (config.limits?.maxDownloadMB ?? 100) * 1024 * 1024 })
            mp3 = await toAudio(f.buffer, 'mp4')
        }
        await conn.sendMessage(m.chat, { audio: mp3, mimetype: 'audio/mpeg', fileName: `${title.slice(0, 50)}.mp3` }, { quoted: m })
        await react(conn, m, '✅')
    } catch (e) {
        console.error('[tiktokmp3] error:', e?.message || e)
        await react(conn, m, '❌')
        const detail = e instanceof ApiError ? e.message : (typeof e === 'number' || /ffmpeg/i.test(String(e?.message)) ? 'Konversi audio gagal (pastikan ffmpeg terpasang).' : String(e?.message || e).split('\n')[0].slice(0, 160))
        await notifReply(box('❌ GAGAL', ['Terjadi kesalahan saat memproses request.', '', `Detail: ${detail}`]), 'TikTok MP3')
    } finally { releaseLock(lock) }
})

export default tiktokmp3
