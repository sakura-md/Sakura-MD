/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Revoke Link')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Revoke Link')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Revoke Link')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat reset link grup.', 'Revoke Link')
    }

    try {
        const code = await conn.groupRevokeInvite(m.chat)
        await notifReply(`✅ Link grup berhasil di-reset.\n\nhttps://chat.whatsapp.com/${code}`, 'Revoke Link')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal reset link grup, coba lagi.', 'Revoke Link')
    }
}

handler.command = ['revoke', 'resetlink']
handler.group = true
handler.desc = 'Reset link invite grup'

export default handler