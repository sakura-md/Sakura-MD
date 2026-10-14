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
            category: 'installer',
            title: 'Installer Menu',
            emoji: '💻',
            highlight: 'installer 💻'
        })
    } catch (e) {
        console.error('[InstallerMenu] Error:', e)
        await notifReply(`Gagal menampilkan Installer Menu:\n${e.message}`, 'Installer Menu')
    }
}

handler.command = ['installermenu', 'menuinstaller']
handler.desc = 'Daftar fitur installer'

export default handler