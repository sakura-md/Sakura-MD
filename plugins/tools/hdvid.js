/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { fileTypeFromBuffer } from 'file-type'
import config from '../../config.js'
import { ApiError, sakuraRequest, downloadBuffer, pickResultUrl, formatBytes } from '../../lib/api.js'
import { uploadBuffer } from '../../lib/uploader.js'
import { getMediaSource } from '../../lib/wa.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur ini — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
const API_KEY = ''   // ← isi API key SakuraApis kamu di antara tanda kutip
const BASE_URL = 'https://api.haidarxd.my.id'
const sakura = (endpoint, params = {}, opts = {}) => sakuraRequest(endpoint, params, { apikey: API_KEY, baseUrl: BASE_URL, ...opts })


const TITLE = 'HD Video'
const ENDPOINT = '/api/v1/tools/hdvid'
const MB = 1024 * 1024
const ALLOWED_INPUT = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/3gpp'])
const SCALE = 2
const CRF = 18

let handler = async (m, { conn, prefix, notifReply }) => {
    const pfx = prefix || config.prefix?.[0] || '.'
    const source = getMediaSource(m, 'video')
    if (!source) return notifReply(`Kirim video dengan caption ${pfx}hdvid, atau reply video dengan ${pfx}hdvid.`, TITLE)

    const maxBytes = (config.limits?.maxVideoMB ?? 50) * MB
    if (source.size > maxBytes) return notifReply(`Video terlalu besar (${formatBytes(source.size)}). Maksimal ${formatBytes(maxBytes)}.`, TITLE)

    if (!m.isOwner) {
        const cd = checkCooldown(`hdvid:${m.sender}`, config.limits?.cooldown?.hdvid ?? 120)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    }

    const lockKey = `hdvid:${m.sender}`
    if (!acquireLock(lockKey)) return notifReply('Masih ada proses HD Video yang berjalan. Tunggu sampai selesai ya.', TITLE)

    try {
        let buffer
        try {
            buffer = await source.download()
        } catch (e) {
            console.error('[hdvid] gagal download media WA:', e)
            return notifReply('Gagal mengambil video dari pesan. Coba kirim ulang videonya.', TITLE)
        }
        if (!buffer || !buffer.length) return notifReply('Video kosong / gagal dibaca.', TITLE)
        if (buffer.length > maxBytes) return notifReply(`Video terlalu besar (${formatBytes(buffer.length)}). Maksimal ${formatBytes(maxBytes)}.`, TITLE)

        const detected = await fileTypeFromBuffer(buffer).catch(() => null)
        if (!detected || !ALLOWED_INPUT.has(detected.mime)) {
            return notifReply('File itu bukan video yang didukung (MP4 / MOV / WEBM / MKV / 3GP).', TITLE)
        }

        await notifReply(`⏳ HD Video (${SCALE}x, crf ${CRF}) sedang diproses...\nIni bisa memakan waktu beberapa menit, jangan kirim ulang.`, TITLE)

        const uploaded = await uploadBuffer(buffer, { filename: `sakura-${Date.now()}.${detected.ext}`, mime: detected.mime })

        const data = await sakura(ENDPOINT, { url: uploaded.url, scale: SCALE, crf: CRF }, {
            timeout: config.timeouts?.video ?? 300000,
            maxBytes: 200 * MB
        })

        let output
        if (data.binary) {
            output = { buffer: data.binary, mime: data.mime, size: data.binary.length, ext: '' }
        } else {
            const resultUrl = pickResultUrl(data, { exclude: [uploaded.url] })
            if (!resultUrl) {
                console.error('[hdvid] respon tanpa URL hasil:', JSON.stringify(data).slice(0, 500))
                throw new ApiError('API tidak mengembalikan URL hasil video.', { code: 'NO_RESULT' })
            }
            try {
                output = await downloadBuffer(resultUrl)
            } catch (e) {
                if (e instanceof ApiError && e.code === 'TOO_LARGE') {
                    return notifReply(`${e.message}\n\nUnduh hasilnya lewat link:\n${resultUrl}`, TITLE)
                }
                throw e
            }
        }

        if (!output.mime.startsWith('video/')) {
            throw new ApiError(`Hasil dari API bukan video (diterima ${output.mime}).`, { code: 'BAD_MIME' })
        }

        const caption = `🎬 *HD VIDEO*\n\n🔎 Upscale: ${SCALE}x (crf ${CRF})\n📦 Ukuran: ${formatBytes(output.size)}`
        if (output.mime === 'video/mp4' || output.mime === 'video/quicktime') {
            await conn.sendMessage(m.chat, { video: output.buffer, mimetype: 'video/mp4', caption }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                document: output.buffer,
                mimetype: output.mime,
                fileName: `hdvid-${Date.now()}.${output.ext || 'mp4'}`,
                caption
            }, { quoted: m })
        }
    } catch (e) {
        console.error('[hdvid error]', e)
        await notifReply(e instanceof ApiError ? e.message : `Gagal memproses video: ${e.message}`, TITLE)
    } finally {
        releaseLock(lockKey)
    }
}

handler.command = ['hdvid', 'hdvideo']
handler.desc = 'Tingkatkan kualitas video (upscale 2x)'
handler.tags = ['tools']

export default handler