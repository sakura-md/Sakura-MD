/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import path from 'path'
import { listPluginFiles } from '../../handler.js'

let handler = async (m, { notifReply }) => {
    const items = listPluginFiles().filter(
        p => p.commands.length
    )

    const byDir = {}

    for (const p of items) {
        ;(byDir[path.dirname(p.rel)] ||= []).push(
            path.basename(p.rel, '.js')
        )
    }

    const lines = Object.entries(byDir).map(
        ([d, names]) =>
            `*${path.basename(d)}* (${names.length})\n${names.join(', ')}`
    )

    await notifReply(
        `Total: ${items.length} file, ${new Set(items.flatMap(p => p.commands)).size} command\n\n${lines.join('\n\n')}`.slice(0, 3500),
        'Plugins'
    )
}

handler.command = ['plugins', 'listplugin']
handler.desc = 'Daftar plugin terpasang'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Plugins'
handler.requirePrefix = true

export default handler
