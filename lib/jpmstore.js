/*
Made By Seikagenou
Telegram : t.me/seikagenou
Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Root project Sakura-MD
const root = path.resolve(__dirname, '../database')
const file = path.join(root, 'jpm.json')

const defaultData = () => ({
delay: 1500,
channels: []
})

export function readJpm() {
try {
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

    return {
        ...defaultData(),
        ...(data && typeof data === 'object' && !Array.isArray(data)
            ? data
            : {}),
        channels: Array.isArray(data?.channels)
            ? data.channels
            : []
    }
} catch (error) {
    if (error.code !== 'ENOENT') {
        console.error('[jpmstore] Gagal membaca database:', error)
    }

    return defaultData()
}

}

export function writeJpm(data) {
fs.mkdirSync(root, { recursive: true })

const safeData = {
    ...defaultData(),
    ...(data && typeof data === 'object' ? data : {}),
    channels: Array.isArray(data?.channels)
        ? data.channels
        : []
}

fs.writeFileSync(file, JSON.stringify(safeData, null, 2))

}

export function normalizeChannelId(input) {
const raw = String(input || '').trim()
const match = raw.match(/[0-9]{5,}@[a-z.]+|[0-9]{5,}/i)

if (!match) return ''

const id = match[0]
return id.includes('@') ? id : `${id}@newsletter`

}

export const pause = ms =>
new Promise(resolve => setTimeout(resolve, ms))