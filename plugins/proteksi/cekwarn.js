/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, num } from '../../lib/format.js'
import { getGroup } from '../../lib/guard.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { args, conn }) => {
    const target = getTarget(m, args)
    if (!target) return sendInapp(conn, m, 'Tag/reply member yang mau dicek warning-nya.')

    const g = getGroup(m.chat)
    const n = g.warns[num(target)] || 0

    return sendInapp(
        conn,
        m,
        `⚠️ @${num(target)}: ${n}/${g.warnlimit} warning`,
        { mentions: [target] }
    )
}

handler.command = ['cekwarn']
handler.desc = 'Cek warning member'
handler.tags = ['proteksi']
handler.group = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
