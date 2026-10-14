/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginDir = path.join(__dirname, '..')

function countPluginFiles(dir) {
    if (!fs.existsSync(dir)) return 0
    let total = 0
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) total += countPluginFiles(full)
        else if (item.isFile() && item.name.endsWith('.js')) total++
    }
    return total
}

const handler = async (m, { conn }) => {
    const total = countPluginFiles(pluginDir)
    await conn.sendMessage(m.chat, { text: `Total ${total} Fitur` }, { quoted: m })
}

handler.command = ['totalfitur', 'totalfiturjs']
handler.desc = 'Menghitung jumlah file plugin JavaScript'
handler.tags = ['system']

export default handler
