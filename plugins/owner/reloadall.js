/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { box } from '../../lib/format.js'
import { reloadAllPlugins } from '../../handler.js'

let handler = async (m, { notifReply }) => {
    const res = await reloadAllPlugins()

    await notifReply(
        box('RELOAD ALL', [
            `Berhasil : ${res.ok} file`,
            `Command  : ${res.commands}`,
            `Gagal    : ${res.failed.length}${res.failed.length ? '\n┃ ' + res.failed.slice(0, 8).join('\n┃ ') : ''}`
        ]),
        'Reload All'
    )
}

handler.command = ['reloadall']
handler.desc = 'Reload seluruh plugin'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Reload All'
handler.requirePrefix = true

export default handler
