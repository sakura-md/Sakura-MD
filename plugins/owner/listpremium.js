/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { num, box } from '../../lib/format.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')

const readList = name => {
    try {
        return JSON.parse(fs.readFileSync(path.join(root, 'database', name), 'utf8'))
    } catch {
        return []
    }
}

let handler = async (m, { notifReply }) => {
    const prem = readList('premium.json').map(num)

    await notifReply(
        prem.length
            ? box('DAFTAR PREMIUM', prem.map((n, i) => `${i + 1}. ${n}`))
            : 'Belum ada user premium',
        'List Premium'
    )
}

handler.command = ['listprem', 'listpremium']
handler.desc = 'Daftar premium'
handler.tags = ['owner']
handler.owner = true
handler.title = 'List Premium'
handler.requirePrefix = true

export default handler
