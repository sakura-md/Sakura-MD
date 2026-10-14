/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { pfxOf } from '../../lib/format.js'
import {
    reloadPlugin,
    findPluginFile
} from '../../handler.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const file = findPluginFile(text.trim())

    if (!file) {
        return notifReply(
            `Plugin tidak ditemukan.\nContoh: ${pfxOf(prefix)}reload tiktok\nLihat daftar: ${pfxOf(prefix)}plugins`,
            'Reload'
        )
    }

    const res = await reloadPlugin(file)

    await notifReply(
        res.ok
            ? `✅ Plugin dimuat ulang (${res.commands.length} command).`
            : `❌ Gagal reload: ${String(res.error?.message || 'error').split('\n')[0]}\nVersi lama tetap aktif`,
        'Reload'
    )
}

handler.command = ['reload']
handler.desc = 'Reload satu plugin: .reload <nama>'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Reload'
handler.requirePrefix = true

export default handler
