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
            category: 'sewa',
            title: 'Sewa Menu',
            emoji: '💰',
            highlight: 'Sewa 💰'
        })
    } catch (e) {
        console.error('[SewaMenu] Error:', e)
        await notifReply(`Gagal menampilkan Sewa Menu:\n${e.message}`, 'Sewa Menu')
    }
}

handler.command = ['sewamenu', 'menusewa']
handler.desc = 'Daftar fitur sewa'
handler.sewaFree = true

export default handler