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
            category: 'apk',
            title: 'APK Menu',
            emoji: '📳',
            highlight: 'APK 📳'
        })
    } catch (e) {
        console.error('[APKMenu] Error:', e)
        await notifReply(`Gagal menampilkan APK Menu:\n${e.message}`, 'APK Menu')
    }
}

handler.command = ['apkmenu', 'menuapk']
handler.desc = 'Daftar fitur apk'

export default handler