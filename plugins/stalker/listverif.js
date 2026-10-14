/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { pfxOf } from '../../lib/format.js'
import { listVerif } from '../../lib/verifdb.js'
import { sendInapp } from '../../lib/inapp.js'

const PER_PAGE = 15

const fmtDate = ms => ms
    ? new Date(ms).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

let handler = async (m, { conn, args, prefix }) => {
    const pfx = pfxOf(prefix)

    // Urut dari yang paling awal diverifikasi
    const all = listVerif()
        .filter(u => u?.tiktok)
        .sort((a, b) => (a.verifiedAt || 0) - (b.verifiedAt || 0))

    if (!all.length) {
        return sendInapp(conn, m, `Belum ada akun TikTok yang terverifikasi.\nGunakan ${pfx}verif @username`)
    }

    const pages = Math.max(1, Math.ceil(all.length / PER_PAGE))
    const asked = parseInt(args?.[0], 10)
    const page = Number.isFinite(asked) ? Math.min(Math.max(asked, 1), pages) : 1
    const start = (page - 1) * PER_PAGE

    const rows = all.slice(start, start + PER_PAGE).map((u, i) => {
        const lines = [`${start + i + 1}. *@${u.tiktok}*`]
        if (u.nickname) lines.push(`   ${u.nickname}`)
        // Nomor WhatsApp hanya ditampilkan ke owner
        const who = [u.waName, m.isOwner && u.phone ? `+${u.phone}` : ''].filter(Boolean).join(' • ')
        if (who) lines.push(`   ${who}`)
        lines.push(`   Verifikasi: ${fmtDate(u.verifiedAt)}`)
        return lines.join('\n')
    })

    let text = `• *Daftar Akun Terverifikasi*\n• Total: *${all.length}* akun\n\n${rows.join('\n\n')}`
    text += `\n\nHalaman ${page}/${pages}`
    if (page < pages) text += `\nLihat berikutnya: ${pfx}listverif ${page + 1}`

    return sendInapp(conn, m, text)
}

handler.command = [
    'listverif',
    'listverifikasi'
]

handler.desc =
    'Daftar akun TikTok yang sudah terverifikasi'

handler.tags = [
    'stalker'
]

export default handler