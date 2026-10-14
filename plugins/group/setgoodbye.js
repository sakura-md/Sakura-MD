/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getGroup, saveGroups } from '../../lib/guard.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const t = text.trim()

    if (!t || t.length > 500) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}setgoodbye Sampai jumpa @user!\nVariabel: @user (member), @group (nama grup)\nMaks 500 karakter`,
            'goodbye'
        )
    }

    getGroup(m.chat).goodbye.text = t
    saveGroups()

    await notifReply('✅ Pesan goodbye diperbarui.', 'goodbye')
}

handler.command = ['setgoodbye']
handler.desc = 'Atur pesan goodbye'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Goodbye'
handler.requirePrefix = true

export default handler
