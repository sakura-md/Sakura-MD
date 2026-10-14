/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import { pfxOf, box } from '../../lib/format.js'
import {
    findPluginFile,
    listPluginFiles
} from '../../handler.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const file = findPluginFile(
        text.trim()
    )

    if (!file) {
        return notifReply(
            `Plugin tidak ditemukan.\nContoh: ${pfxOf(prefix)}plugininfo tiktok`,
            'Plugin Info'
        )
    }

    const info = listPluginFiles().find(
        p => p.file === file
    )

    const stat = fs.statSync(file)

    await notifReply(
        box('PLUGIN INFO', [
            `File    : ${info.rel}`,
            `Command : ${info.commands.join(', ')}`,
            `Ukuran  : ${(stat.size / 1024).toFixed(1)} KB`,
            `Diubah  : ${stat.mtime.toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta'
            })}`
        ]),
        'Plugin Info'
    )
}

handler.command = ['plugininfo']
handler.desc = 'Info plugin: .plugininfo <nama>'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Plugin Info'
handler.requirePrefix = true

export default handler
