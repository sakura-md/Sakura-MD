/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.js'
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
    const creators = (config.creator || []).map(num)
    const owners = readList('owner.json').map(num)

    await notifReply(box('DAFTAR OWNER', [
        'Creator:',
        ...(creators.length ? creators.map(n => `• ${n}`) : ['-']),
        '',
        'Owner:',
        ...(owners.length ? owners.map(n => `• ${n}`) : ['-'])
    ]), 'List Owner')
}

handler.command = ['listowner']
handler.desc = 'Daftar owner'
handler.tags = ['owner']
handler.owner = true
handler.title = 'List Owner'
handler.requirePrefix = true

export default handler
