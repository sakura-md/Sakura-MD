/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getGroup, saveGroups } from '../../lib/guard.js'

let handler = async (m, { args, notifReply }) => {
    const arg = String(args[0] || '').toLowerCase()
    const g = getGroup(m.chat)

    if (!['on', 'off'].includes(arg)) {
        return notifReply(
            `Contoh:\n.setantispam on\n.setantispam off`,
            'Anti Spam'
        )
    }

    g.antispam = arg === 'on'
    saveGroups()

    return notifReply(
        g.antispam
            ? '✅ Anti Spam berhasil diaktifkan'
            : '❌ Anti Spam berhasil dinonaktifkan',
        'Set Anti Spam'
    )
}

handler.command = ['setantispam']
handler.desc = 'Aktif/nonaktif deteksi pesan berulang'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Set Anti Spam'
handler.requirePrefix = true

export default handler
