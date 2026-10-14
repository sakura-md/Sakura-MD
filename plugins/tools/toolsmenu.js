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
            category: 'tools',
            title: 'Tools Menu',
            emoji: '🔧',
            highlight: 'Tools 🔧'
        })
    } catch (e) {
        console.error('[ToolsMenu] Error:', e)
        await notifReply(`Gagal menampilkan Tools Menu:\n${e.message}`, 'Tools Menu')
    }
}

handler.command = ['toolsmenu', 'menutools']
handler.desc = 'Daftar fitur tools'

export default handler