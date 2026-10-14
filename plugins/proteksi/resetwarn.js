/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, num } from '../../lib/format.js'
import { getGroup, saveGroups } from '../../lib/guard.js'

let handler = async (m, { args, notifReply }) => {
    const g = getGroup(m.chat)
    const target = getTarget(m, args)

    if (target) delete g.warns[num(target)]
    else g.warns = {}

    saveGroups()

    return notifReply(
        target
            ? `✅ Warning @${num(target)} direset.`
            : '✅ Semua warning grup direset.',
        'Warn'
    )
}

handler.command = ['resetwarn']
handler.desc = 'Reset warning (member / semua)'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
