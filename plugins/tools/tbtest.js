/*
  Tes templateButtons: .tbtest  (teks)  |  .tbtest img  (dengan gambar)
*/
let handler = async (m, { conn, args }) => {
    const buttons = [
        { displayText: '📖 Menu', id: '.menu' },
        { displayText: '🏓 Ping', id: '.ping' },
        { displayText: '🌐 Website', url: 'https://github.com/sakura-md/Baileys' }
    ]
    const base = { text: '*Test Template Button*\nTekan salah satu tombol di bawah.', footer: 'Sakura-MD', buttons }
    if ((args[0] || '').toLowerCase() === 'img') {
        return conn.sendTemplateButtons(m.chat, { ...base, image: { url: 'https://picsum.photos/600/300' } }, { quoted: m })
    }
    return conn.sendTemplateButtons(m.chat, base, { quoted: m })
}

handler.command = ['tbtest', 'templatetest']
handler.desc = 'Tes tombol template (quick reply / url)'
handler.tags = ['tools']

export default handler
