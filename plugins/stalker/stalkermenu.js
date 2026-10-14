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
            category: 'stalker',
            title: 'Stalker Menu',
            emoji: '🔍',
            highlight: 'Stalker 🔍'
        })
    } catch (e) {
        console.error('[StalkerMenu] Error:', e)
        await notifReply(`Gagal menampilkan Stalker Menu:\n${e.message}`, 'Stalker Menu')
    }
}

handler.command = ['stalkermenu', 'menustalker']
handler.desc = 'Daftar fitur stalker'

export default handler