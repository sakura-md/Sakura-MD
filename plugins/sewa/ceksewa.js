/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import {
    getRental,
    graceLeftMs,
    timeLeftMs,
    resolveSewaTarget,
    formatDate,
    formatRemaining
} from '../../lib/sewa.js'

let handler = async (m, { conn, args, prefix, notifReply }) => {
    // Owner boleh cek grup lain (ID / link). User biasa hanya grup tempat command dipakai.
    let gid = null
    if (m.isOwner) {
        const t = await resolveSewaTarget(conn, m, args)
        if (t.invalid) return notifReply('Link undangan grup tidak valid atau tidak bisa dibaca.', 'Cek Sewa')
        gid = t.groupId
    } else if (m.isGroup) {
        gid = m.chat
    }

    if (!gid) {
        return notifReply(
            m.isOwner
                ? `Gunakan di dalam grup, atau:\n${pfxOf(prefix)}ceksewa <id/link grup>`
                : 'Gunakan command ini di dalam grup untuk mengecek masa sewa grup tersebut',
            'Cek Sewa'
        )
    }

    const r = getRental(gid)

    if (!r) {
        return notifReply(
            `╭━━〔 🌸 *STATUS SEWA SAKURA-MD* 〕━━⬣
┃ Status : ❌ Belum Menyewa
┃ Grup   : ${gid}
┃
┃ Grup ini belum memiliki data sewa.
┃ Ketik ${pfxOf(prefix)}sewa untuk lihat paket,
┃ atau hubungi owner.${graceLeftMs(gid) ? `
┃
┃ ⚠️ Bot keluar dalam ${Math.ceil(graceLeftMs(gid) / 60000)} menit
┃ jika sewa tidak segera diaktifkan.` : ''}
╰━━━━━━━━━━━━━━━━━━⬣`,
            'Cek Sewa'
        )
    }

    const active = !r.expired
    const status = r.permanent ? '✅ Aktif (Permanen)' : active ? '✅ Aktif' : '❌ Habis'
    const sisa = r.permanent
        ? 'Permanen ♾️'
        : active ? formatRemaining(timeLeftMs(gid)) : 'Masa sewa telah habis'

    await notifReply(
        `╭━━〔 🌸 *STATUS SEWA SAKURA-MD* 〕━━⬣
┃ Grup   : ${gid}
┃ Status : ${status}
┣━━━━━━━━━━━━━━━━━━⬣
┃ 📦 Paket Sewa
┃ ${r.plan || '-'}
┃
┃ 🗓️ Mulai
┃ ${formatDate(r.startDate)}
┃
┃ ⏳ Masa Berakhir
┃ ${r.permanent ? 'Permanen ♾️' : formatDate(r.expireDate)}
┃
┃ ⌛ Sisa Masa Sewa
┃ ${sisa}
╰━━━━━━━━━━━━━━━━━━⬣

> 🌸 Terima kasih telah menggunakan Sakura-MD 💕`,
        'Cek Sewa'
    )
}

handler.command = ['ceksewa']
handler.desc = 'Cek status sewa grup'
handler.tags = ['sewa']
handler.sewaFree = true
handler.title = 'Cek Sewa'
handler.requirePrefix = true

export default handler
