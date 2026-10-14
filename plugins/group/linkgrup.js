/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

let handler = async (m, { conn, notifReply }) => {
    const code = await conn.groupInviteCode(m.chat)

    await notifReply(
        `🔗 https://chat.whatsapp.com/${code}`,
        'Link Grup'
    )
}

handler.command = ['linkgroup', 'linkgc', 'linkgrup']
handler.desc = 'Ambil link grup (admin)'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.title = 'Link Grup'
handler.requirePrefix = true

export default handler
