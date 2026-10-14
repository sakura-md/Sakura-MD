/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveSetting } from '../../lib/settings.js'
import {
    pfxOf,
    toggleMsg,
    toggleExample
} from '../../lib/format.js'

let handler = async (m, { args, prefix, notifReply }) => {
    const v = String(args[0] || '').toLowerCase()

    if (!['on', 'off'].includes(v)) {
        return notifReply(
            toggleExample(
                pfxOf(prefix),
                'maintenance'
            ),
            'Maintenance'
        )
    }

    config.maintenance = {
        ...(config.maintenance || {}),
        on: v === 'on'
    }

    saveSetting(
        'maintenance',
        config.maintenance
    )

    await notifReply(
        `${toggleMsg(v === 'on', 'Maintenance')}${v === 'on' ? '\nHanya Owner yang bisa memakai bot.' : ''}`,
        'Maintenance'
    )
}

handler.command = ['maintenance']
handler.desc = 'Aktif/nonaktif maintenance mode'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Maintenance'
handler.requirePrefix = true

export default handler
