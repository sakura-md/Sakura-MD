/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin, isSameJid, getBotJid } from '../../lib/myfunc.js'

// Destructive command: requires typing ".kickall yakin" to actually run,
// so a stray/mistyped ".kickall" can't wipe out a group by accident.
let handler = async (m, { conn, args, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Kick All')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Kick All')

    if (!m.isOwner) {
        return notifReply('Fitur ini khusus Owner bot (bukan cuma Admin Grup) karena bisa mengosongkan grup.', 'Kick All')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat kick semua member.', 'Kick All')
    }

    if ((args[0] || '').toLowerCase() !== 'yakin') {
        return notifReply('⚠️ Ini akan kick SEMUA member (kecuali Admin & bot).\n\nKalau yakin, ketik:\n.kickall yakin', 'Kick All')
    }

    const botJid = getBotJid(conn)
    const targets = groupMetadata.participants
        .map(p => p.id)
        .filter(id => !isSameJid(id, botJid) && !isGroupAdminJid(groupMetadata.participants, id))

    if (!targets.length) return notifReply('Gak ada member yang bisa di-kick (semua Admin/bot).', 'Kick All')

    try {
        await conn.groupParticipantsUpdate(m.chat, targets, 'remove')
        await notifReply(`✅ *Berhasil kick ${targets.length} member*`, 'Kick All')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal kick semua member, coba lagi.', 'Kick All')
    }
}

handler.command = ['kickall']
handler.group = true
handler.desc = 'Kick semua member (kecuali Admin) — butuh konfirmasi'

export default handler