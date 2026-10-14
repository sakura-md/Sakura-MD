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
            category: 'cek',
            title: 'Cek Menu',
            emoji: '🎯',
            highlight: 'Cek 🎯'
        })
    } catch (e) {
        console.error('[CekMenu] Error:', e)
        await notifReply(`Gagal menampilkan Cek Menu:\n${e.message}`, 'Cek Menu')
    }
}

handler.command = ['cekmenu', 'menucek']
handler.desc = 'Daftar fitur cek'

export default handler