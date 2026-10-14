/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import sharp from 'sharp'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { findMedia, MB_ } from '../../lib/media.js'
import { toAudio, toPTT, toVideo } from '../../lib/converter.js'
import { uploadBuffer } from '../../lib/uploader.js'
import { formatBytes } from '../../lib/api.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'

const T = { tags: ['tools'] }
const extOf = (mime, fallback) => (String(mime).split('/')[1] || fallback).split(';')[0].replace(/[^a-z0-9]/gi, '').slice(0, 5) || fallback

// Pembungkus konversi: validasi media, batas ukuran, cooldown, lock per user
const converter = ({ names, title, desc, kinds, maxMB = 30, hint, run }) => cmd({ command: names, desc, ...T, title }, async (m, ctx) => {
    const { conn, prefix, notifReply } = ctx
    const media = findMedia(m, kinds)
    if (!media) return notifReply(`${hint}\nContoh: reply media lalu ketik ${pfxOf(prefix)}${names[0]}`, title)
    if (media.size > maxMB * MB_) return notifReply(`File terlalu besar (maks ${maxMB} MB).`, title)
    if (!m.isOwner) {
        const cd = checkCooldown(`media:${m.sender}`, 5)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik.`, title)
    }
    const lock = `media:${m.sender}`
    if (!acquireLock(lock)) return notifReply('Masih ada proses media yang berjalan.', title)
    try {
        await notifReply('⏳ Memproses...', title)
        await run(m, ctx, media, await media.download())
    } catch (e) {
        if (typeof e === 'number' || /ffmpeg|spawn/i.test(String(e?.message))) throw new Error('Konversi gagal — pastikan ffmpeg terpasang dan format file didukung.')
        throw e
    } finally { releaseLock(lock) }
})

const list = [
    converter({ names: ['tomp3', 'toaudio'], title: 'To MP3', desc: 'Video/audio jadi MP3', kinds: ['video', 'audio'], hint: 'Reply video atau audio.',
        run: async (m, { conn }, media, buf) => conn.sendMessage(m.chat, { audio: await toAudio(buf, extOf(media.mime, 'mp4')), mimetype: 'audio/mpeg' }, { quoted: m }) }),
    converter({ names: ['tovn', 'tovoice'], title: 'To VN', desc: 'Video/audio jadi voice note', kinds: ['video', 'audio'], hint: 'Reply video atau audio.',
        run: async (m, { conn }, media, buf) => conn.sendMessage(m.chat, { audio: await toPTT(buf, extOf(media.mime, 'mp4')), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m }) }),
    converter({ names: ['tovideo', 'tomp4'], title: 'To Video', desc: 'Sticker animasi/GIF/video jadi MP4', kinds: ['video', 'sticker'], maxMB: 20, hint: 'Reply sticker animasi, GIF, atau video.',
        run: async (m, { conn }, media, buf) => {
            const out = await toVideo(buf, media.kind === 'sticker' ? 'webp' : extOf(media.mime, 'mp4'))
            await conn.sendMessage(m.chat, { video: out, mimetype: 'video/mp4', caption: '✅ Selesai' }, { quoted: m })
        } }),

    converter({ names: ['tourl', 'upload'], title: 'To URL', desc: 'Upload media ke link publik sementara', kinds: ['image', 'video', 'audio', 'sticker', 'document'], maxMB: 50, hint: 'Reply gambar/video/audio/file.',
        run: async (m, { notifReply }, media, buf) => {
            const ext = extOf(media.mime, 'bin')
            const up = await uploadBuffer(buf, { filename: `sakura-${Date.now()}.${ext}`, mime: media.mime || 'application/octet-stream' })
            await notifReply(box('TO URL', [`Link  : ${up.url}`, `Ukuran: ${formatBytes(buf.length)}`, `Host  : ${up.host}`, '', 'Link publik — jangan upload data pribadi.']), 'To URL')
        } }),

    converter({ names: ['crop'], title: 'Crop', desc: 'Potong gambar jadi persegi (tengah)', kinds: ['image'], maxMB: 15, hint: 'Reply gambar.',
        run: async (m, { conn }, media, buf) => {
            const meta = await sharp(buf).metadata()
            const side = Math.min(meta.width || 0, meta.height || 0)
            if (!side) throw new Error('Gambar tidak terbaca.')
            const out = await sharp(buf).extract({ left: Math.floor((meta.width - side) / 2), top: Math.floor((meta.height - side) / 2), width: side, height: side }).jpeg({ quality: 90 }).toBuffer()
            await conn.sendMessage(m.chat, { image: out, caption: `✅ ${side}×${side}` }, { quoted: m })
        } }),

    cmd({ command: ['resize'], desc: 'Ubah ukuran gambar: .resize 800x600 | .resize 500', ...T, title: 'Resize' }, async (m, { conn, args, prefix, notifReply }) => {
        const media = findMedia(m, ['image'])
        const mt = String(args[0] || '').toLowerCase().match(/^(\d{2,4})(?:x(\d{2,4}))?$/)
        if (!media || !mt) return notifReply(`Reply gambar lalu ketik:\n${pfxOf(prefix)}resize 800x600\natau ${pfxOf(prefix)}resize 500 (lebar saja)\nBatas 32–4000 px.`, 'Resize')
        const [w, h] = [Number(mt[1]), mt[2] ? Number(mt[2]) : null]
        if (w < 32 || w > 4000 || (h !== null && (h < 32 || h > 4000))) return notifReply('Ukuran harus 32–4000 px.', 'Resize')
        if (media.size > 15 * MB_) return notifReply('File terlalu besar (maks 15 MB).', 'Resize')
        const out = await sharp(await media.download()).resize(w, h, { fit: h ? 'fill' : 'inside' }).jpeg({ quality: 90 }).toBuffer()
        await conn.sendMessage(m.chat, { image: out, caption: `✅ ${w}${h ? `×${h}` : ' px lebar'}` }, { quoted: m })
    }),

    cmd({ command: ['compress', 'kompres'], desc: 'Kompres gambar: .compress [kualitas 10-90]', ...T, title: 'Compress' }, async (m, { conn, args, prefix, notifReply }) => {
        const media = findMedia(m, ['image'])
        if (!media) return notifReply(`Reply gambar lalu ketik ${pfxOf(prefix)}compress 60`, 'Compress')
        const q = args[0] ? Number(args[0]) : 60
        if (!Number.isInteger(q) || q < 10 || q > 90) return notifReply('Kualitas harus 10–90.', 'Compress')
        if (media.size > 15 * MB_) return notifReply('File terlalu besar (maks 15 MB).', 'Compress')
        const buf = await media.download()
        const out = await sharp(buf).jpeg({ quality: q, mozjpeg: true }).toBuffer()
        await conn.sendMessage(m.chat, { image: out, caption: `✅ ${formatBytes(buf.length)} → ${formatBytes(out.length)} (kualitas ${q})` }, { quoted: m })
    }),

    // QR memakai paket opsional: qrcode (buat) dan jsqr (baca). Jika belum terpasang, dijelaskan apa adanya.
    cmd({ command: ['qr', 'qrcode'], desc: 'Buat QR dari teks/link', ...T, title: 'QR' }, async (m, { conn, text, prefix, notifReply }) => {
        const t = (text.trim() || m.quoted?.text || '').trim()
        if (!t || t.length > 800) return notifReply(`Contoh: ${pfxOf(prefix)}qr https://contoh.com\n(maks 800 karakter)`, 'QR')
        let QR
        try { QR = (await import('qrcode')).default } catch { return notifReply('❌ Fitur sementara tidak tersedia.\nPaket `qrcode` belum terpasang. Jalankan: npm install', 'QR') }
        const png = await QR.toBuffer(t, { width: 512, margin: 2 })
        await conn.sendMessage(m.chat, { image: png, caption: '✅ QR berhasil dibuat' }, { quoted: m })
    }),
    cmd({ command: ['readqr', 'scanqr'], desc: 'Baca isi QR dari gambar', ...T, title: 'Read QR' }, async (m, { prefix, notifReply }) => {
        const media = findMedia(m, ['image'])
        if (!media) return notifReply(`Reply gambar QR lalu ketik ${pfxOf(prefix)}readqr`, 'Read QR')
        if (media.size > 10 * MB_) return notifReply('File terlalu besar (maks 10 MB).', 'Read QR')
        let jsQR
        try { jsQR = (await import('jsqr')).default } catch { return notifReply('❌ Fitur sementara tidak tersedia.\nPaket `jsqr` belum terpasang. Jalankan: npm install', 'Read QR') }
        const { data, info } = await sharp(await media.download()).ensureAlpha().resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).raw().toBuffer({ resolveWithObject: true })
        const code = jsQR(new Uint8ClampedArray(data), info.width, info.height)
        await notifReply(code?.data ? `📷 Isi QR:\n${code.data.slice(0, 1500)}` : '❌ QR tidak terdeteksi. Pastikan gambar jelas dan QR terlihat utuh.', 'Read QR')
    })
]

export default list[0]
export const handlers = list.slice(1)