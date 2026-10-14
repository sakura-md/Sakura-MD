/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { fileTypeFromBuffer } from 'file-type'
import config from '../../config.js'
import { ApiError, sakuraRequest, downloadBuffer, pickResultUrl, formatBytes } from '../../lib/api.js'
import { uploadBuffer } from '../../lib/uploader.js'
import { sendChoiceButtons, getMediaSource } from '../../lib/wa.js'
import { getStore, randomToken } from '../../lib/cache.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { isSameJid } from '../../lib/myfunc.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur ini — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
const API_KEY = ''   // ← isi API key SakuraApis kamu di antara tanda kutip
const BASE_URL = 'https://api.haidarxd.my.id'
const sakura = (endpoint, params = {}, opts = {}) => sakuraRequest(endpoint, params, { apikey: API_KEY, baseUrl: BASE_URL, ...opts })


const TITLE = 'HD Image'
const ENDPOINT = '/api/v1/ai/upscaler'
const MB = 1024 * 1024
const ALLOWED_INPUT = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SEND_AS_DOCUMENT_ABOVE = 12 * MB

// Gambar yang menunggu pilihan skala disimpan sementara (10 menit, maks 30 gambar)
const pending = getStore('hd-image-pending', 10 * 60 * 1000, 30)

const parseScale = (value) => {
    const match = String(value || '').toLowerCase().match(/^([24])x?$/)
    return match ? Number(match[1]) : null
}

async function upscale(conn, m, { buffer, mime, ext, scale }, notifReply) {
    const lockKey = `hd:${m.sender}`
    if (!acquireLock(lockKey)) return notifReply('Masih ada proses HD yang berjalan. Tunggu sampai selesai ya.', TITLE)

    try {
        await notifReply(`⏳ Upscale ${scale}x sedang diproses...\nBisa memakan waktu sampai 1-2 menit.`, TITLE)

        // API butuh URL -> upload dulu ke host sementara
        const uploaded = await uploadBuffer(buffer, { filename: `sakura-${Date.now()}.${ext}`, mime })

        const data = await sakura(ENDPOINT, { url: uploaded.url, scale }, {
            timeout: config.timeouts?.upscale ?? 120000
        })

        let output
        if (data.binary) {
            output = { buffer: data.binary, mime: data.mime, size: data.binary.length }
        } else {
            const resultUrl = pickResultUrl(data, { exclude: [uploaded.url] })
            if (!resultUrl) {
                console.error('[hd] respon tanpa URL hasil:', JSON.stringify(data).slice(0, 500))
                throw new ApiError('API tidak mengembalikan URL hasil gambar.', { code: 'NO_RESULT' })
            }
            output = await downloadBuffer(resultUrl)
        }

        if (!output.mime.startsWith('image/')) {
            throw new ApiError(`Hasil dari API bukan gambar (diterima ${output.mime}).`, { code: 'BAD_MIME' })
        }

        const caption = `✨ *HD IMAGE*\n\n🔎 Upscale: ${scale}x\n📦 Ukuran: ${formatBytes(output.size)}`
        if (output.size > SEND_AS_DOCUMENT_ABOVE) {
            await conn.sendMessage(m.chat, {
                document: output.buffer,
                mimetype: output.mime,
                fileName: `hd-${scale}x-${Date.now()}.${output.ext || 'png'}`,
                caption
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, { image: output.buffer, caption }, { quoted: m })
        }
    } finally {
        releaseLock(lockKey)
    }
}

let handler = async (m, { conn, args, command, prefix, notifReply }) => {
    const pfx = prefix || config.prefix?.[0] || '.'

    try {
        // ---- Callback dari tombol: .hdgo <token> <2|4>
        if (command === 'hdgo') {
            const [token, rawScale] = args
            const entry = token ? pending.get(token) : null
            const scale = parseScale(rawScale)
            if (!entry) return notifReply(`Pilihan sudah kedaluwarsa. Kirim ulang gambar dengan caption ${pfx}hd.`, TITLE)
            if (!scale) return notifReply('Skala tidak valid. Pilih 2x atau 4x.', TITLE)
            if (!m.isOwner && !isSameJid(entry.sender, m.sender)) return notifReply('Pilihan ini milik pengguna lain.', TITLE)

            pending.delete(token)
            return await upscale(conn, m, { ...entry, scale }, notifReply)
        }

        // ---- Command utama: .hd (caption gambar / reply gambar), opsional .hd 2 / .hd 4
        const source = getMediaSource(m, 'image')
        if (!source) {
            return notifReply(`Kirim gambar dengan caption ${pfx}hd, atau reply gambar dengan ${pfx}hd.\n\nOpsional langsung pilih skala: ${pfx}hd 2 atau ${pfx}hd 4`, TITLE)
        }

        const maxBytes = (config.limits?.maxImageMB ?? 10) * MB
        if (source.size > maxBytes) return notifReply(`Gambar terlalu besar (${formatBytes(source.size)}). Maksimal ${formatBytes(maxBytes)}.`, TITLE)

        if (!m.isOwner) {
            const cd = checkCooldown(`hd:${m.sender}`, config.limits?.cooldown?.hd ?? 30)
            if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
        }

        let buffer
        try {
            buffer = await source.download()
        } catch (e) {
            console.error('[hd] gagal download media WA:', e)
            return notifReply('Gagal mengambil gambar dari pesan. Coba kirim ulang gambarnya.', TITLE)
        }
        if (!buffer || !buffer.length) return notifReply('Gambar kosong / gagal dibaca.', TITLE)
        if (buffer.length > maxBytes) return notifReply(`Gambar terlalu besar (${formatBytes(buffer.length)}). Maksimal ${formatBytes(maxBytes)}.`, TITLE)

        const detected = await fileTypeFromBuffer(buffer).catch(() => null)
        if (!detected || !ALLOWED_INPUT.has(detected.mime)) {
            return notifReply('File itu bukan gambar yang didukung. Gunakan JPG, PNG, atau WEBP.', TITLE)
        }

        const media = { buffer, mime: detected.mime, ext: detected.ext, sender: m.sender }

        const directScale = parseScale(args[0])
        if (directScale) return await upscale(conn, m, { ...media, scale: directScale }, notifReply)

        const token = randomToken()
        pending.set(token, media)

        await sendChoiceButtons(conn, m, {
            title: '✨ HD IMAGE',
            text: '✨ *HD IMAGE*\n\nPilih skala upscale:\n\n2️⃣ 2x Upscale\n4️⃣ 4x Upscale',
            footer: 'Pilihan berlaku 10 menit',
            items: [
                { id: `${pfx}hdgo ${token} 2`, label: '2️⃣ 2x Upscale' },
                { id: `${pfx}hdgo ${token} 4`, label: '4️⃣ 4x Upscale' }
            ],
            fallbackText: `✨ *HD IMAGE*\n\nPilih skala:\n2️⃣ 2x → ${pfx}hdgo ${token} 2\n4️⃣ 4x → ${pfx}hdgo ${token} 4`
        })
    } catch (e) {
        console.error('[hd error]', e)
        await notifReply(e instanceof ApiError ? e.message : `Gagal memproses gambar: ${e.message}`, TITLE)
    }
}

handler.command = ['hd', 'hdimage', 'hdgo', 'upscale']
handler.desc = 'Tingkatkan kualitas gambar (upscale 2x/4x)'
handler.tags = ['tools']

export default handler