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
            category: 'anime',
            title: 'Anime Menu',
            emoji: '🍥',
            highlight: 'Anime 🍥'
        })
    } catch (e) {
        console.error('[AnimeMenu] Error:', e)
        await notifReply(`Gagal menampilkan Anime Menu:\n${e.message}`, 'Anime Menu')
    }
}

handler.command = ['animemenu', 'menuanime']
handler.desc = 'Daftar fitur anime'

export default handler
