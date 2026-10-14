/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../../config.js'

const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..'
)

// Periksa data config yang belum diisi
const isPlaceholder = value =>
    !value ||
    /x{3,}/i.test(String(value)) ||
    /^nama pemilik/i.test(String(value))

// Cari gambar pembayaran
function findImage(configured) {
    const candidates = [
        configured,
        ...['jpg', 'jpeg', 'png', 'webp'].map(
            ext => `media/dana.${ext}`
        )
    ].filter(Boolean)

    for (const rel of candidates) {
        const file = path.resolve(ROOT, rel)

        if (!file.startsWith(ROOT + path.sep)) continue

        try {
            if (fs.statSync(file).isFile()) {
                return file
            }
        } catch {}
    }

    return null
}

let handler = async (m, { conn, notifReply }) => {
    const dana = config.payment?.dana || {}

    if (
        isPlaceholder(dana.number) ||
        isPlaceholder(dana.name)
    ) {
        return notifReply(
            m.isOwner
                ? 'Info pembayaran belum diatur.\nIsi payment.dana.number dan payment.dana.name di config.js.'
                : 'Info pembayaran belum tersedia, hubungi owner.',
            'Payment'
        )
    }

    const number = String(dana.number).trim()
    const name = String(dana.name).trim()

    const caption = `*୨୧ ─────────────── ୨୧*
*♡ SAKURA PAYMENT ♡*
*୨୧ ─────────────── ୨୧*

*꒰ა SCAN QRIS ໒꒱*
*୨୧ Praktis • Aman • Cepat*

*♡ PAYMENT AVAILABLE ♡*
*┊ Dana • GoPay • OVO*

*୨୧ ─────────────── ୨୧*

*Nama akun:* ${name}
*Nomor DANA:* ${number}

*୨୧ ─────────────── ୨୧*

*⚠ PENTING!*
*┊ Kirim bukti transfer*
*┊ Transaksi NO REFUND*
*┊ Nominal harus sesuai*

*Thank you for shopping ♡*
*୨୧ ─────────────── ୨୧*`

    const image = findImage(dana.image)

    // Kirim informasi pembayaran
    if (image) {
        await conn.sendMessage(
            m.chat,
            {
                image: fs.readFileSync(image),
                caption
            },
            { quoted: m }
        )
    } else {
        await conn.sendMessage(
            m.chat,
            { text: caption },
            { quoted: m }
        )
    }
}

handler.command = ['payment', 'bayar', 'pembayaran', 'dana']
handler.desc = 'Info pembayaran Sakura'
handler.tags = ['sewa']
handler.sewaFree = true
handler.title = 'Payment'
handler.requirePrefix = true

export default handler
