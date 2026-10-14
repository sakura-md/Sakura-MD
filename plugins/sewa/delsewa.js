/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import { delRental, getRental, resolveSewaTarget, graceLeftMs, GRACE_MS } from '../../lib/sewa.js'

let handler = async (m, { conn, args, prefix, notifReply }) => {
    const { groupId, invalid } = await resolveSewaTarget(conn, m, args)

    if (invalid) return notifReply('Link undangan grup tidak valid atau tidak bisa dibaca.', 'Del Sewa')
    if (!groupId) {
        return notifReply(`Gunakan di grup target, atau:\n${pfxOf(prefix)}delsewa <id/link grup>`, 'Del Sewa')
    }

    if (!getRental(groupId)) {
        const left = graceLeftMs(groupId)
        return notifReply(
            left
                ? `Sewa grup ini sudah dihapus.\nBot keluar dalam ${Math.ceil(left / 60000)} menit kecuali sewa ditambahkan lagi (${pfxOf(prefix)}addsewa).`
                : `Grup ini tidak punya data sewa.\n${groupId}`,
            'Del Sewa'
        )
    }

    delRental(groupId)

    await notifReply(
        `╭━━〔 🗑️ *SEWA DIHAPUS* 〕━━⬣
┃ Grup : ${groupId}
┃
┃ Data sewa sudah dihapus.
┃ Kamu punya ${GRACE_MS / 60000} menit untuk
┃ ${pfxOf(prefix)}addsewa lagi. Lewat dari itu,
┃ bot keluar otomatis dari grup.
╰━━━━━━━━━━━━━━━━━━⬣`,
        'Del Sewa'
    )
}

handler.command = ['delsewa', 'hapussewa']
handler.desc = 'Hapus sewa grup (bot keluar otomatis)'
handler.tags = ['sewa']
handler.owner = true
handler.title = 'Del Sewa'
handler.requirePrefix = true

export default handler
