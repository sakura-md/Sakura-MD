/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getGroup, saveGroups } from '../../lib/guard.js'
import { pfxOf, parseOnOff, toggleMsg, toggleExample } from '../../lib/format.js'

let handler = async (m, { args, prefix, notifReply }) => {
    const g = getGroup(m.chat)
    const v = parseOnOff(args[0])

    if (v === null) {
        return notifReply(toggleExample(pfxOf(prefix), 'setantibot'), 'Anti Bot')
    }

    g.antibot = v
    saveGroups()

    await notifReply(
        toggleMsg(v, 'Anti Bot'),
        'Anti Bot'
    )
}

handler.command = ['setantibot']
handler.desc = 'Aktif/nonaktif deteksi klien bot'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Anti Bot'
handler.requirePrefix = true

export default handler
