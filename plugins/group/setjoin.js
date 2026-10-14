/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'
import { pfxOf, toggleMsg, toggleExample } from '../../lib/format.js'

let handler = async (m, { conn, args, prefix, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Set Join Approval')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Set Join Approval')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Set Join Approval')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat atur approval join grup.', 'Set Join Approval')
    }

    const mode = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(mode)) {
        return notifReply(toggleExample(pfxOf(prefix), 'setjoin'), 'Set Join Approval')
    }

    try {
        if (typeof conn.groupJoinApprovalMode !== 'function') {
            return notifReply('Fitur ini butuh versi Baileys yang lebih baru (groupJoinApprovalMode belum tersedia di versi yang terpasang).', 'Set Join Approval')
        }
        await conn.groupJoinApprovalMode(m.chat, mode)
        await notifReply(toggleMsg(mode === 'on', 'Approval Join'), 'Set Join Approval')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal atur approval join grup, coba lagi.', 'Set Join Approval')
    }
}

handler.command = ['setjoin', 'joinapproval']
handler.group = true
handler.desc = 'Atur approval member baru'

export default handler