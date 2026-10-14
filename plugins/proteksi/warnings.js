/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, num } from '../../lib/format.js'
import { getGroup } from '../../lib/guard.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { args, conn }) => {
    const g = getGroup(m.chat)
    const target = getTarget(m, args)

    if (target) {
        const n = g.warns[num(target)] || 0
        return sendInapp(
            conn,
            m,
            `⚠️ @${num(target)}: ${n}/${g.warnlimit} warning`,
            { mentions: [target] }
        )
    }

    const entries = Object.entries(g.warns)
    if (!entries.length) return sendInapp(conn, m, 'Belum ada member yang punya warning.')

    return sendInapp(
        conn,
        m,
        `⚠️ *Daftar Warning* (batas ${g.warnlimit})\n\n` +
        entries.map(([n, c]) => `• @${n} — ${c}`).join('\n'),
        {
            mentions: entries.map(([n]) => `${n}@s.whatsapp.net`)
        }
    )
}

handler.command = ['warnings']
handler.desc = 'Lihat warning member'
handler.tags = ['proteksi']
handler.group = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
