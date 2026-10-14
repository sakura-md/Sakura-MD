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
            category: 'primbon',
            title: 'Primbon Menu',
            emoji: '🔮',
            highlight: 'Primbon 🔮'
        })
    } catch (e) {
        console.error('[PrimbonMenu] Error:', e)
        await notifReply(`Gagal menampilkan Primbon Menu:\n${e.message}`, 'Primbon Menu')
    }
}

handler.command = ['primbonmenu', 'menuprimbon']
handler.desc = 'Daftar fitur primbon'

export default handler