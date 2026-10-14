/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { requestRestart } from '../../lib/autorestart.js'

let handler = async (m, { conn, notifReply }) => {
    await notifReply(
        'Bot dimulai ulang, tunggu beberapa detik...',
        'Restart'
    )

    requestRestart('perintah .restart dari owner', 1500)
}

handler.command = ['restart']
handler.desc = 'Mulai ulang bot'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Restart'
handler.requirePrefix = true

export default handler
