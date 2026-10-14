/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { sendCategoryMenu } from '../../lib/menubuilder.js'

let handler = async (m, { conn, prefix, notifReply }) => {
    try {
        await sendCategoryMenu(conn, m, {
            prefix,
            category: 'ephoto',
            title: 'Ephoto Menu',
            emoji: '✨',
            highlight: 'Ephoto ✨'
        })
    } catch (e) {
        console.error('[EphotoMenu] Error:', e)
        await notifReply(`Gagal menampilkan Ephoto Menu:\n${e.message}`, 'Ephoto Menu')
    }
}

handler.command = ['ephotomenu', 'menuephoto']
handler.desc = 'Daftar fitur ephoto'

export default handler