/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Penyimpanan JSON sederhana per-namespace (database/<name>.json).
// - Dibaca sekali lalu di-cache di memori (modul lib tidak ikut hot-reload plugin).
// - Simpan ditunda (debounce) supaya tidak menulis disk di setiap pesan.
// - File rusak tidak menjatuhkan bot: dipakai default, file lama dicadangkan sebagai .corrupt.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(__dirname, '../database')

const stores = new Map()
const timers = new Map()

function filePath(name) {
    if (!/^[a-z0-9_-]+$/i.test(name)) throw new Error(`Nama database tidak valid: ${name}`)
    return path.join(dbDir, `${name}.json`)
}

export function getDb(name, defaults = {}) {
    if (stores.has(name)) return stores.get(name)
    const file = filePath(name)
    let data
    try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'))
        if (!data || typeof data !== 'object') throw new Error('bukan object')
    } catch (e) {
        if (e.code !== 'ENOENT') {
            try { fs.copyFileSync(file, `${file}.corrupt`) } catch {}
            console.error(`[db] ${name}.json tidak terbaca (${e.message}), memakai default.`)
        }
        data = JSON.parse(JSON.stringify(defaults))
    }
    for (const [k, v] of Object.entries(defaults)) if (data[k] === undefined) data[k] = JSON.parse(JSON.stringify(v))
    stores.set(name, data)
    return data
}

export function saveDb(name, immediate = false) {
    const data = stores.get(name)
    if (!data) return
    const write = () => {
        timers.delete(name)
        try {
            if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
            const file = filePath(name)
            fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2))
            fs.renameSync(`${file}.tmp`, file)
        } catch (e) {
            console.error(`[db] gagal menyimpan ${name}:`, e.message)
        }
    }
    if (immediate) {
        if (timers.has(name)) clearTimeout(timers.get(name))
        return write()
    }
    if (timers.has(name)) return
    timers.set(name, setTimeout(write, 3000))
}

// Simpan semua yang tertunda (dipanggil saat shutdown/restart)
export function flushAll() {
    for (const name of [...timers.keys()]) saveDb(name, true)
}

process.once('exit', flushAll)