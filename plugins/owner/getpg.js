/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import { resolvePluginPath } from '../../lib/pluginpath.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn, args, prefix }) => {
    const pfx = prefix || '.'
    const target = args[0]

    const reply = text => sendInapp(conn, m, text)

    if (!target) {
        return reply(
            `- *Contoh:*\n${pfx}getpg plugins/folder/file.js`
        )
    }

    const resolved = resolvePluginPath(target, { mustExist: true })

    if (!resolved.ok) {
        return reply(resolved.error)
    }

    const { abs, rel } = resolved

    try {
        const stat = fs.statSync(abs)

        if (!stat.isFile()) {
            return reply('❌ Path tersebut bukan file.')
        }

        // Ambil nama file saja, tanpa path
        const fileName = String(rel).split(/[\\/]/).pop()

        await conn.sendMessage(
            m.chat,
            {
                document: fs.readFileSync(abs),
                mimetype: 'text/javascript',
                fileName
            },
            { quoted: m }
        )

    } catch (e) {
        console.error('[getpg]', e)
        return reply(`❌ Gagal mengambil plugin:\n${e.message}`)
    }
}

handler.command = ['getpg', 'getplugin']
handler.desc = 'Mengambil file plugin'
handler.owner = true

export default handler