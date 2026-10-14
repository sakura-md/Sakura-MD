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
            `Contoh: ${pfxOf(prefix)}setwelcome Halo @user, selamat datang di @group!\nVariabel: @user (member), @group (nama grup)\nMaks 500 karakter`,
            'welcome'
        )
    }

    getGroup(m.chat).welcome.text = t
    saveGroups()

    await notifReply('✅ Pesan welcome diperbarui.', 'welcome')
}

handler.command = ['setwelcome']
handler.desc = 'Atur pesan welcome'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Welcome'
handler.requirePrefix = true

export default handler
