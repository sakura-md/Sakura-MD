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
            category: 'rpg',
            title: 'RPG Menu',
            emoji: '⚔️',
            highlight: 'RPG ⚔️'
        })
    } catch (e) {
        console.error('[RPGMenu] Error:', e)
        await notifReply(`Gagal menampilkan RPG Menu:\n${e.message}`, 'RPG Menu')
    }
}

handler.command = ['rpgmenu', 'menurpg']
handler.desc = 'Daftar fitur rpg'

export default handler