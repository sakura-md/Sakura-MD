/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'
import { getGroup, saveGroups } from '../../lib/guard.js'

let handler = async (m, { args, prefix, notifReply }) => {
    const n = Number(args[0])

    if (!Number.isInteger(n) || n < 1 || n > 10) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}warnlimit 3 (1-10)`,
            'Warn'
        )
    }

    getGroup(m.chat).warnlimit = n
    saveGroups()

    return notifReply(`✅ Batas warning: ${n}`, 'Warn')
}

handler.command = ['warnlimit']
handler.desc = 'Atur batas warning (1-10)'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
