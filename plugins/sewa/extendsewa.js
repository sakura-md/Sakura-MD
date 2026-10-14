/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import {
    extendRental,
    getRental,
    normalizePlan,
    parseDuration,
    resolveSewaTarget,
    formatDate,
    formatRemaining,
    timeLeftMs
} from '../../lib/sewa.js'

let handler = async (m, { conn, args, prefix, notifReply }) => {
    const { groupId, rest, invalid } = await resolveSewaTarget(conn, m, args)

    let plan = null
    const timeTokens = []
    for (const t of rest) {
        const p = normalizePlan(t)
        if (p && !plan) plan = p
        else timeTokens.push(t)
    }

    const parsed = parseDuration(timeTokens.join(''))
    if (!parsed) {
        const p = pfxOf(prefix)
        return notifReply(
            `Format:\n${p}extendsewa [paket] <waktu> [id/link grup]\n\nContoh:\n${p}extendsewa 30d\n${p}extendsewa premium 7d\n${p}extendsewa permanent`,
            'Extend Sewa'
        )
    }
    if (invalid) return notifReply('Link undangan grup tidak valid atau tidak bisa dibaca.', 'Extend Sewa')
    if (!groupId) return notifReply('Gunakan command di grup target atau sertakan ID grup / link undangan.', 'Extend Sewa')

    if (!getRental(groupId)) {
        return notifReply(`Grup ini belum punya data sewa.\nGunakan ${pfxOf(prefix)}addsewa dulu.`, 'Extend Sewa')
    }

    const rental = extendRental(groupId, timeTokens.join(''), plan)

    await notifReply(
        `╭━━〔 🌸 *SEWA DIPERPANJANG* 〕━━⬣
┃ Grup    : ${groupId}
┃ Paket   : ${rental.plan || '-'}
┃ Tambah  : ${parsed.label}
┃ Berakhir: ${rental.permanent ? 'Permanen ♾️' : formatDate(rental.expireDate)}
┃ Sisa    : ${rental.permanent ? 'Permanen ♾️' : formatRemaining(timeLeftMs(groupId))}
╰━━━━━━━━━━━━━━━━━━⬣`,
        'Extend Sewa'
    )
}

handler.command = ['extendsewa', 'perpanjangsewa']
handler.desc = 'Perpanjang sewa grup (extendsewa [paket] waktu)'
handler.tags = ['sewa']
handler.owner = true
handler.title = 'Extend Sewa'
handler.requirePrefix = true

export default handler
