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
            category: 'proteksi',
            title: 'Proteksi Menu',
            emoji: '🛡️',
            highlight: 'Proteksi 🛡️'
        })
    } catch (e) {
        console.error('[ProteksiMenu] Error:', e)
        await notifReply(`Gagal menampilkan Proteksi Menu:\n${e.message}`, 'Proteksi Menu')
    }
}

handler.command = ['proteksimenu', 'menuproteksi']
handler.desc = 'Daftar fitur proteksi'

export default handler