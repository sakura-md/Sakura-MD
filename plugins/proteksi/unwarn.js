/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, num } from '../../lib/format.js'
import { getGroup, saveGroups } from '../../lib/guard.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { args, notifReply, conn }) => {
    const target = getTarget(m, args)
    if (!target) return notifReply('Tag/reply member yang mau dikurangi warning-nya.', 'Warn')

    const g = getGroup(m.chat)
    const key = num(target)
    if (!g.warns[key]) return notifReply('Member itu tidak punya warning.', 'Warn')

    g.warns[key]--
    if (g.warns[key] <= 0) delete g.warns[key]
    saveGroups()

    return sendInapp(
        conn,
        m,
        `✅ Warning @${key} dikurangi. Sisa: ${g.warns[key] || 0}/${g.warnlimit}`,
        { mentions: [target] }
    )
}

handler.command = ['unwarn']
handler.desc = 'Kurangi 1 warning'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
