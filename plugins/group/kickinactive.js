/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin, getGroupAdmins, getBotJid, isSameJid } from '../../lib/myfunc.js'
import { getGroupStats } from '../../lib/activity.js'

// Kicks members with zero tracked activity who've been in the group
// since before tracking started, based on a minimum "silent days" arg.
// Requires ".kickinactive <hari> yakin" — never runs without an explicit
// day threshold AND a confirmation word, since this is destructive.
let handler = async (m, { conn, args, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Kick Inactive')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Kick Inactive')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Kick Inactive')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat kick member.', 'Kick Inactive')
    }

    const days = parseInt(args[0], 10)
    const confirmed = (args[1] || '').toLowerCase() === 'yakin'
    if (!days || days < 1 || !confirmed) {
        return notifReply('Kick member yang gak pernah chat dalam X hari terakhir.\n\nContoh:\n.kickinactive 14 yakin\n\n⚠️ Cuma menghitung sejak fitur activity tracking dipasang — member yang join belum lama tapi belum sempat chat juga bisa ke-kick, jadi cek dulu dengan .inaktif sebelum jalanin ini.', 'Kick Inactive')
    }

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const stats = getGroupStats(m.chat)
    const botJid = getBotJid(conn)
    const admins = getGroupAdmins(groupMetadata.participants)

    const targets = groupMetadata.participants
        .map(p => p.id)
        .filter(id => !isSameJid(id, botJid))
        .filter(id => !admins.some(a => isSameJid(a, id)))
        .filter(id => {
            const entry = stats[id]
            return !entry || entry.lastSeen < cutoff
        })

    if (!targets.length) return notifReply('Gak ada member yang memenuhi kriteria inaktif.', 'Kick Inactive')

    try {
        await conn.groupParticipantsUpdate(m.chat, targets, 'remove')
        await notifReply(`✅ Berhasil kick ${targets.length} member yang gak aktif ${days}+ hari.`, 'Kick Inactive')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal kick member inaktif, coba lagi.', 'Kick Inactive')
    }
}

handler.command = ['kickinactive']
handler.group = true
handler.desc = 'Kick member yang gak aktif X hari — butuh konfirmasi'

export default handler