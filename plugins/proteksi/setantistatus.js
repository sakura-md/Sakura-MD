/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import { getGroup, saveGroups } from '../../lib/guard.js'
import {
    parseStatusSetting,
    durationLabel,
    STATUS_DEFAULT_LIMIT,
    STATUS_DEFAULT_WINDOW,
    STATUS_MAX_LIMIT
} from '../../lib/antistatus.js'

let handler = async (m, { args, prefix, notifReply }) => {
    const g = getGroup(m.chat)
    const p = pfxOf(prefix)

    const limit = Number(g.statusLimit) || STATUS_DEFAULT_LIMIT
    const windowMs = Number(g.statusWindow) || STATUS_DEFAULT_WINDOW

    if (args.length < 2) {
        return notifReply(
            `╭━━〔 🛡️ *ANTI STATUS GRUP* 〕━━⬣
┃ Status : ${g.antistatus ? 'ON ✅' : 'OFF ❌'}
┃ Batas  : ${limit} status
┃ Waktu  : ${durationLabel(windowMs)}
┃
┃ Format:
┃ ${p}setantistatus <batas> <waktu>
┃
┃ Contoh:
┃ ${p}setantistatus 3 24h
┃ ${p}setantistatus 2 12h
┃ ${p}setantistatus 5 7d
┃
┃ Batas : 1 - ${STATUS_MAX_LIMIT}
┃ Waktu : m = menit, h = jam, d = hari
┃
┃ Nyalakan: ${p}antistatus on
┃ Hapus hitungan: ${p}delantistatus
╰━━━━━━━━━━━━━━━━━━⬣`,
            'Set Anti Status'
        )
    }

    const parsed = parseStatusSetting(args[0], args.slice(1).join(''))
    if (parsed.error) return notifReply(`❌ ${parsed.error}`, 'Set Anti Status')

    g.statusLimit = parsed.limit
    g.statusWindow = parsed.windowMs
    saveGroups()

    return notifReply(
        `✅ Pengaturan anti status disimpan.

• Batas : ${parsed.limit} status
• Dalam : ${durationLabel(parsed.windowMs)}

Lebih dari itu = dikeluarkan dari grup.${g.antistatus ? '' : `\n\nFitur masih OFF, nyalakan dengan ${p}antistatus on`}`,
        'Set Anti Status'
    )
}

handler.command = ['setantistatus', 'setstatuslimit']
handler.desc = 'Atur batas status grup (setantistatus batas waktu)'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Set Anti Status'
handler.requirePrefix = true

export default handler
