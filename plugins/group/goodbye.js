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
        return notifReply(toggleExample(pfxOf(prefix), 'goodbye'), 'Goodbye')
    }

    g.goodbye.on = v
    saveGroups()

    await notifReply(
        toggleMsg(v, 'Goodbye'),
        'Goodbye'
    )
}

handler.command = ['goodbye']
handler.desc = 'Goodbye on/off'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Goodbye'
handler.requirePrefix = true

export default handler
