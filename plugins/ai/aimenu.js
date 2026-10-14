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
            category: 'ai',
            title: 'AI Menu',
            emoji: '🤖',
            highlight: 'AI 🤖'
        })
    } catch (e) {
        console.error('[AIMenu] Error:', e)
        await notifReply(`Gagal menampilkan AI Menu:\n${e.message}`, 'AI Menu')
    }
}

handler.command = ['aimenu', 'menuai']
handler.desc = 'Daftar fitur ai'

export default handler