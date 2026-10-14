/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

let handler = async (m, { conn, notifReply }) => {
    await conn.groupSettingUpdate(
        m.chat,
        'announcement'
    )

    await notifReply(
        '🔒 Grup ditutup, hanya admin yang bisa mengirim pesan',
        'Close'
    )
}

handler.command = ['close', 'tutup']
handler.desc = 'Tutup grup (hanya admin yang bisa kirim pesan)'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.title = 'Close'
handler.requirePrefix = true

export default handler
