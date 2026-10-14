/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbDir = path.join(__dirname, '../database')
const settingsPath = path.join(dbDir, 'settings.json')

const VALID_MODES = ['public', 'self']

function readSettings() {
    try {
        const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        return data && typeof data === 'object' ? data : {}
    } catch {
        return {}
    }
}

// Dipanggil sekali saat startup: menerapkan setting runtime (mis. botMode hasil .public/.self)
// ke object config di memori. config.js sendiri tetap statis.
export function loadRuntimeSettings(config) {
    const saved = readSettings()
    if (VALID_MODES.includes(saved.botMode)) config.botMode = saved.botMode
    if (Array.isArray(saved.prefix) && saved.prefix.length && saved.prefix.every(p => typeof p === 'string' && p.length && p.length <= 3)) config.prefix = saved.prefix
    if (typeof saved.botName === 'string' && saved.botName.trim()) config.botName = saved.botName.trim().slice(0, 40)
    config.maintenance = {
        on: saved.maintenance?.on === true,
        text: String(saved.maintenance?.text || 'Bot sedang maintenance. Silakan coba lagi nanti.').slice(0, 300)
    }
    return config
}

export function saveBotMode(mode) {
    if (!VALID_MODES.includes(mode)) throw new Error(`botMode tidak valid: ${mode}`)
    const data = readSettings()
    data.botMode = mode
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8')
}

// Simpan satu setting runtime umum (prefix, botName, maintenance, dll)
export function saveSetting(key, value) {
    const data = readSettings()
    data[key] = value
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8')
}