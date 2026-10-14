/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroupAdmins, isGroupAdminJid } from '../../lib/myfunc.js'

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Info Grup')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Info Grup')

    const admins = getGroupAdmins(groupMetadata.participants)
    let inviteLink = '-'
    if (isGroupAdminJid(groupMetadata.participants, m.sender) || m.isOwner) {
        try {
            const code = await conn.groupInviteCode(m.chat)
            inviteLink = `https://chat.whatsapp.com/${code}`
        } catch {}
    }

    const created = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleString('id-ID') : '-'

    const body = `*Info Grup*

➤ Nama : ${groupMetadata.subject}
➤ ID : ${groupMetadata.id}
➤ Dibuat : ${created}
➤ Total Member : ${groupMetadata.participants.length}
➤ Total Admin : ${admins.length}
➤ Deskripsi :
${groupMetadata.desc || '-'}
➤ Invite Link : ${inviteLink}`

    await notifReply(body, 'Info Grup')
}

handler.command = ['infogc', 'groupinfo']
handler.group = true
handler.desc = 'Info lengkap grup'

export default handler