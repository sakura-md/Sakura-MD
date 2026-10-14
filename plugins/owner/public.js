/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { saveBotMode } from '../../lib/settings.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn }) => {
    const msg = config.modeMessages?.public || {
        already: 'Bot sudah dalam mode Public.',
        success: 'Bot mode berhasil diubah ke Public.',
        saveError: 'Mode Public aktif, tapi gagal disimpan ke database/settings.json (akan kembali ke config.js setelah restart).'
    }

    if (config.botMode === 'public') {
        return sendInapp(conn, m, msg.already)
    }

    config.botMode = 'public'
    conn.public = true

    try {
        saveBotMode('public')
    } catch (e) {
        console.error('[public] gagal menyimpan mode:', e)

        return sendInapp(conn, m, msg.saveError)
    }

    await sendInapp(conn, m, msg.success)
}

handler.command = ['public']
handler.owner = true

export default handler