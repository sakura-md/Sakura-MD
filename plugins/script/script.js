/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imagePath = path.join(__dirname, '../../media/Script.png')

const TITLE = 'Script Sakura-MD'
const DEFAULT_GROUP = 'https://chat.whatsapp.com/HhZMuDV1qrn9MwLescK2S3'
const DEFAULT_CONTACT = 'wa.me/seikageen'

// Tombol URL wajib diawali http(s):// supaya WhatsApp tidak membuang pesannya diam-diam
const toUrl = value => (/^https?:\/\//i.test(value) ? value : `https://${String(value).replace(/^\/+/, '')}`)

const buildCaption = sc => `*Script Sakura-MD 🤖*
*PILIHAN PAKET:*
› *No Update:* ${sc.priceNoUpdate || 'Rp 40.000'}
› *Full Update:* ${sc.priceFullUpdate || 'Rp 60.000'}

*Information for users 💬*
- Harga di atas sudah mendapatkan Free update sampai devnya pensi
- Total fitur aktif 300+
- Type plugin (ESM)
- Stabil connection
- No bad sessions
- No Enc 100%
- Bukan Hasil rename
- Baileys: @sakuraa/baileys
- Support button
- Full pengajaran memasang script

*⭐ Chek Fitur bot*
${sc.group || DEFAULT_GROUP}`

let handler = async (m, { conn }) => {
    const sc = config.script || {}
    const caption = buildCaption(sc)
    const groupUrl = toUrl(sc.group || DEFAULT_GROUP)
    const contactUrl = toUrl(sc.contact || DEFAULT_CONTACT)
    const image = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null
    if (!image) console.warn('[SCRIPT] media/Script.png tidak ditemukan')

    // 1) Native flow buttons lewat helper (membawa node biz + bot untuk chat pribadi)
    try {
        await conn.sendButtons(
            m.chat,
            {
                text: caption,
                footer: TITLE,
                ...(image ? { image } : {}),
                buttons: [
                    { name: 'cta_url', buttonParamsJson: { display_text: 'Check Fitur', url: groupUrl, merchant_url: groupUrl } },
                    { name: 'cta_url', buttonParamsJson: { display_text: 'Chat Owner', url: contactUrl, merchant_url: contactUrl } }
                ]
            },
            { quoted: m }
        )
        return
    } catch (e) {
        console.warn('[SCRIPT] sendButtons gagal, pakai fallback:', e?.message || e)
    }

    // 2) Fallback: gambar + caption biasa (link tetap tampil sebagai teks)
    const fallback = `${caption}\n\n💬 Chat Owner: ${contactUrl}`
    if (image) return conn.sendMessage(m.chat, { image, caption: fallback }, { quoted: m })
    return conn.sendMessage(m.chat, { text: fallback }, { quoted: m })
}

handler.command = ['sc', 'script']
handler.desc = 'Info Script Sakura-MD'
handler.title = 'Script Sakura-MD'
handler.requirePrefix = true

export default handler
