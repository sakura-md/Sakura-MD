/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import {
    addRentalDuration,
    getRental,
    normalizePlan,
    parseDuration,
    resolveSewaTarget,
    formatDate,
    formatRemaining,
    timeLeftMs,
    PLAN_NAMES
} from '../../lib/sewa.js'

const usage = prefix => {
    const p = pfxOf(prefix)
    return `╭━━〔 🌸 *ADD SEWA SAKURA-MD* 〕━━⬣
┃ Format:
┃ ${p}addsewa <paket> <waktu> [id/link grup]
┃
┃ Paket : ${PLAN_NAMES.join(' / ').toLowerCase()}
┃ (kosong = biasa)
┃
┃ Contoh:
┃ ${p}addsewa biasa 30d
┃ ${p}addsewa medium 12h
┃ ${p}addsewa premium permanent
┃ ${p}addsewa premium 7d 1203634xxxx@g.us
┃
┃ Waktu:
┃ s = detik   m = menit   h = jam
┃ d = hari    w = minggu  bulan
┃ angka saja = hari
┃ permanent = selamanya
┃
┃ Tanpa ID/link, grup tempat command dipakai.
╰━━━━━━━━━━━━━━━━━━⬣`
}

let handler = async (m, { conn, args, prefix, notifReply }) => {
    const { groupId, rest, invalid } = await resolveSewaTarget(conn, m, args)

    // Paket boleh di posisi mana saja ("premium 30d" atau "30d premium"); sisanya = durasi.
    let plan = null
    const timeTokens = []
    for (const t of rest) {
        const p = normalizePlan(t)
        if (p && !plan) plan = p
        else timeTokens.push(t)
    }

    const parsed = parseDuration(timeTokens.join(''))
    if (!parsed) return notifReply(usage(prefix), 'Add Sewa')

    if (invalid) {
        return notifReply('Link undangan grup tidak valid atau tidak bisa dibaca.', 'Add Sewa')
    }
    if (!groupId) {
        return notifReply('Gunakan command di grup target atau sertakan ID grup / link undangan.', 'Add Sewa')
    }

    const existing = getRental(groupId)
    if (existing && !existing.expired) {
        const sisa = existing.permanent ? 'Permanen ♾️' : formatRemaining(timeLeftMs(groupId))
        return notifReply(
            `╭━━〔 ⚠️ *SEWA MASIH AKTIF* 〕━━⬣
┃ Grup  : ${groupId}
┃ Paket : ${existing.plan || '-'}
┃ Sisa  : ${sisa}
┃
┃ Untuk menambah waktu gunakan:
┃ ${pfxOf(prefix)}extendsewa <waktu>
┃ Untuk menghapus: ${pfxOf(prefix)}delsewa
╰━━━━━━━━━━━━━━━━━━⬣`,
            'Add Sewa'
        )
    }

    const rental = addRentalDuration(groupId, m.sender, timeTokens.join(''), plan || 'Biasa')

    await notifReply(
        `╭━━〔 🌸 *SEWA SAKURA-MD AKTIF* 〕━━⬣
┃ Grup    : ${groupId}
┃ Paket   : ${rental.plan}
┃ Durasi  : ${parsed.label}
┃ Mulai   : ${formatDate(rental.startDate)}
┃ Berakhir: ${rental.permanent ? 'Permanen ♾️' : formatDate(rental.expireDate)}
┃ Status  : Aktif ✅
╰━━━━━━━━━━━━━━━━━━⬣`,
        'Add Sewa'
    )
}

handler.command = ['addsewa']
handler.desc = 'Aktifkan sewa grup (addsewa paket waktu)'
handler.tags = ['sewa']
handler.owner = true
handler.title = 'Add Sewa'
handler.requirePrefix = true

export default handler
