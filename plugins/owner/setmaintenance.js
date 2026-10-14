/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveSetting } from '../../lib/settings.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const t = text.trim()

    if (!t || t.length > 300) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}setmaintenance Bot update, kembali jam 20.00`,
            'Maintenance'
        )
    }

    config.maintenance = {
        on: config.maintenance?.on === true,
        text: t
    }

    saveSetting(
        'maintenance',
        config.maintenance
    )

    await notifReply(
        '✅ Pesan maintenance diperbarui',
        'Maintenance'
    )
}

handler.command = ['setmaintenance']
handler.desc = 'Atur pesan maintenance'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Maintenance'
handler.requirePrefix = true

export default handler
