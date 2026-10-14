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
            category: 'sticker',
            title: 'Sticker Menu',
            emoji: '🪄',
            highlight: 'Sticker 🪄'
        })
    } catch (e) {
        console.error('[StickerMenu] Error:', e)
        await notifReply(`Gagal menampilkan Sticker Menu:\n${e.message}`, 'Sticker Menu')
    }
}

handler.command = ['stickermenu', 'menusticker']
handler.desc = 'Daftar fitur sticker'

export default handler