/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

let handler = async (m, { conn, notifReply }) => {
    await conn.groupSettingUpdate(
        m.chat,
        'not_announcement'
    )

    await notifReply(
        '🔓 Grup dibuka, semua member bisa mengirim pesan',
        'Open'
    )
}

handler.command = ['open', 'buka']
handler.desc = 'Buka grup (semua member bisa kirim pesan)'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.title = 'Open'
handler.requirePrefix = true

export default handler
