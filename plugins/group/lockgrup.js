/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'
import { pfxOf, toggleMsg, toggleExample } from '../../lib/format.js'

// lockgrup    -> only admins can send messages (WA "announcement" mode)
// lockprofile -> only admins can edit group name/photo/description
// proteksi    -> toggles both at once
let handler = async (m, { conn, args, command, prefix, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Lock Grup')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Lock Grup')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Lock Grup')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat atur setting grup.', 'Lock Grup')
    }

    const mode = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(mode)) {
        return notifReply(toggleExample(pfxOf(prefix), command), 'Lock Grup')
    }

    try {
        if (command === 'lockgrup') {
            await conn.groupSettingUpdate(m.chat, mode === 'on' ? 'announcement' : 'not_announcement')
            await notifReply(toggleMsg(mode === 'on', 'Lock Grup'), 'Lock Grup')
        } else if (command === 'lockprofile') {
            await conn.groupSettingUpdate(m.chat, mode === 'on' ? 'locked' : 'unlocked')
            await notifReply(toggleMsg(mode === 'on', 'Lock Profile'), 'Lock Grup')
        } else {
            // proteksi: both at once
            await conn.groupSettingUpdate(m.chat, mode === 'on' ? 'announcement' : 'not_announcement')
            await conn.groupSettingUpdate(m.chat, mode === 'on' ? 'locked' : 'unlocked')
            await notifReply(toggleMsg(mode === 'on', 'Proteksi'), 'Proteksi')
        }
    } catch (e) {
        console.error(e)
        await notifReply('Gagal atur setting grup, coba lagi.', 'Lock Grup')
    }
}

handler.command = ['lockgrup', 'lockprofile', 'proteksi']
handler.group = true
handler.desc = 'Kunci pesan/info grup khusus Admin'

export default handler