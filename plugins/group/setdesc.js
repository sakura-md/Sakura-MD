/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'

let handler = async (m, { conn, text, command, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Set Desc')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Set Desc')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Set Desc')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat ganti deskripsi grup.', 'Set Desc')
    }

    const isClear = command === 'cleardesc'
    if (!isClear && !text) return notifReply('Contoh:\n.setdesc Deskripsi grup baru\natau .cleardesc buat mengosongkan.', 'Set Desc')

    const newDesc = isClear ? '' : text

    try {
        await conn.groupUpdateDescription(m.chat, newDesc)
        await notifReply(isClear ? '✅ Deskripsi grup dikosongkan.' : `✅ Deskripsi grup diganti.`, 'Set Desc')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal ganti deskripsi grup, coba lagi.', 'Set Desc')
    }
}

handler.command = ['setdesc', 'cleardesc']
handler.group = true
handler.desc = 'Ganti/kosongkan deskripsi grup'

export default handler