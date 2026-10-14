/* Made By Seikagenou | Telegram : t.me/seikagenou */
import { normalizeChannelId } from '../../lib/jpmstore.js'

let handler = async (m, { conn, args, text }) => {
    const raw = String(text || '').trim()
    const id = normalizeChannelId(args?.[0] || '')

    if (!id) {
        return m.reply(
            'Format: .sendch ID_CHANNEL pesan\nContoh: .sendch 120363xxxxxxxxxx@newsletter Halo channel!'
        )
    }

    const message = raw.replace(/^\S+\s*/, '')
    if (!message) return m.reply('Teks pesan belum diisi. Format: .sendch ID_CHANNEL pesan')

    try {
        await conn.sendMessage(id, { text: message })
        return m.reply(`✅ Pesan dikirim ke ${id}`)
    } catch (e) {
        const detail = String(e?.message || e).slice(0, 180)
        return m.reply(
            `❌ Gagal mengirim ke ${id}. Pastikan ID benar, channel bisa diakses, dan API Baileys mendukung pengiriman.\nDetail: ${detail}`
        )
    }
}

handler.command = ['sendch']
handler.desc = 'Kirim pesan ke satu channel pribadi/tujuan'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Send Channel'
handler.requirePrefix = true

export default handler
