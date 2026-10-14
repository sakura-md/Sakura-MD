/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveBotMode } from '../../lib/settings.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn }) => {
    const msg = config.modeMessages?.self || {
        already: 'Bot sudah dalam mode Self.',
        success: 'Bot mode berhasil diubah ke Self.',
        saveError: 'Mode Self aktif, tapi gagal disimpan ke database/settings.json (akan kembali ke config.js setelah restart).'
    }

    if (config.botMode === 'self') {
        return sendInapp(conn, m, msg.already)
    }

    config.botMode = 'self'
    conn.public = false

    try {
        saveBotMode('self')
    } catch (e) {
        console.error('[self] gagal menyimpan mode:', e)

        return sendInapp(conn, m, msg.saveError)
    }

    await sendInapp(conn, m, msg.success)
}

handler.command = ['self']
handler.owner = true

export default handler