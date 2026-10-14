/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveSetting } from '../../lib/settings.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { args, prefix, notifReply }) => {
    const next = [...new Set(args)].filter(Boolean)

    if (
        !next.length ||
        next.length > 8 ||
        next.some(p => p.length > 3 || /[a-z0-9\s]/i.test(p))
    ) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}setprefix . # ! /\nPrefix berupa simbol 1-3 karakter, maks 8 prefix.\nSaat ini: ${config.prefix.join(' ')}`,
            'Set Prefix'
        )
    }

    config.prefix = next
    saveSetting('prefix', next)

    await notifReply(`✅ Prefix: ${next.join(' ')}`, 'Set Prefix')
}

handler.command = ['setprefix']
handler.desc = 'Atur prefix (pisahkan spasi)'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Set Prefix'
handler.requirePrefix = true

export default handler
