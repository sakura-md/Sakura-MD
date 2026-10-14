/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveSetting } from '../../lib/settings.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const name = text.trim()

    if (!name || name.length > 40) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}setbotname Sakura-MD\n(maks 40 karakter)`,
            'Set Bot Name'
        )
    }

    config.botName = name
    saveSetting('botName', name)

    await notifReply(`✅ Nama bot: *${name}*`, 'Set Bot Name')
}

handler.command = ['setbotname']
handler.desc = 'Ubah nama bot'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Set Bot Name'
handler.requirePrefix = true

export default handler
