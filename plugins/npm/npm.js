/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

let handler = async (m, { conn }) => {
    const pushname = m.pushName || 'No Name'

    const text = `> 📢 *haloo ${pushname}, saya ada rekomendasi library baileys bot WhatsApp* [ *@sakuraa/baileys@latest* ]

- Support AiRich
- Support html
- Support table A2UI
- No logout sender
- Update Proto terbaru
- Support all type button
- Support custom pairing
- Support script type cjs & esm
- dll

📦 *packages* 📦
https://www.npmjs.com/package/@sakuraa/baileys`

    try {
        await conn.sendMessage(
            m.chat,
            {
                text,
                templateMode: 'native',
                templateButtons: [
                    {
                        displayText: 'Copy baileys',
                        id: 'copy_baileys',
                        copy_code: '"@sakuraa/baileys": "latest"'
                    },
                    {
                        displayText: 'Information',
                        url: 'https://whatsapp.com/channel/0029VbCBQjqDjiOVYmYTSi0X'
                    }
                ]
            },
            { quoted: m }
        )
    } catch (e) {
        console.error('[NPM]', e)
    }
}

handler.command = ['npm']

export default handler