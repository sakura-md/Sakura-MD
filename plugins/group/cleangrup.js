/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'
import { clearGroupStats } from '../../lib/activity.js'

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Clean Grup')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Clean Grup')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Clean Grup')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu.', 'Clean Grup')
    }

    try {
        // "Clean" here = reset the tracked activity history for this group,
        // so topaktif/inaktif/kickinactive start counting fresh from now.
        clearGroupStats(m.chat)
        await notifReply('✅ *Data aktivitas grup direset*', 'Clean Grup')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal reset data grup, coba lagi.', 'Clean Grup')
    }
}

handler.command = ['cleangrup']
handler.group = true
handler.desc = 'Reset data aktivitas grup (buat topaktif/inaktif)'

export default handler