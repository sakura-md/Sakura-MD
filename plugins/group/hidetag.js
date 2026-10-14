/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroupAdmins } from '../../lib/myfunc.js'

let handler = async (m, { conn, text }) => {
    const say = msg => conn.sendMessage(m.chat, { text: msg }, { quoted: m })

    if (!m.isGroup) return say('Command ini cuma bisa dipakai di dalam grup')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return say('Gagal mengambil data grup, coba lagi')

    const admins = getGroupAdmins(groupMetadata.participants)
    if (!admins.includes(m.sender) && !m.isOwner) {
        return say('Fitur ini khusus Admin Grup')
    }

    const mentions = groupMetadata.participants.map(p => p.id)
    const pesan = text || m.quoted?.text || ''
    if (!pesan.trim()) {
        return say('Tulis teksnya atau reply pesan yang mau di-hidetag')
    }

    try {
        await conn.sendMessage(m.chat, {
            text: pesan,
            mentions
        }, { quoted: m })
    } catch (e) {
        console.error(e)
        await say('Gagal kirim hidetag, coba lagi')
    }
}

handler.command = ['hidetag', 'ht']
handler.group = true
handler.desc = 'Tag semua member grup (hidden)'

export default handler