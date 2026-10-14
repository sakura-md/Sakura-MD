/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'

let handler = async (m, { conn, text, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Set Name')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Set Name')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Set Name')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat ganti nama grup.', 'Set Name')
    }
    if (!text) return notifReply('Contoh:\n.setname Nama Grup Baru', 'Set Name')
    if (text.length > 25) return notifReply('Nama grup maksimal 25 karakter.', 'Set Name')

    try {
        await conn.groupUpdateSubject(m.chat, text)
        await notifReply(`✅ Nama grup diganti jadi: *${text}*`, 'Set Name')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal ganti nama grup, coba lagi.', 'Set Name')
    }
}

handler.command = ['setname', 'setnamegc']
handler.group = true
handler.desc = 'Ganti nama grup'

export default handler