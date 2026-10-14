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
const dbPath = path.join(dbDir, 'activity.json')

// NOTE: this only tracks activity from the moment it's installed onward —
// there's no historical message log to backfill, so "inactive" numbers
// below are always relative to when this file started recording, not to
// when a member actually joined.

let cache = null
let dirty = false

function load() {
    if (cache) return cache
    try {
        cache = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch {
        cache = {}
    }
    return cache
}

function save() {
    if (!dirty) return
    try {
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
        fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2))
        dirty = false
    } catch (e) {
        console.error('[activity] gagal simpan:', e.message)
    }
}

let saveTimer = null
function scheduleSave() {
    dirty = true
    if (saveTimer) return
    saveTimer = setTimeout(() => {
        saveTimer = null
        save()
    }, 5000)
}

export function trackMessage(groupId, jid) {
    if (!groupId || !jid) return
    const db = load()
    if (!db[groupId]) db[groupId] = {}
    const entry = db[groupId][jid] || { count: 0, lastSeen: 0 }
    entry.count += 1
    entry.lastSeen = Date.now()
    db[groupId][jid] = entry
    scheduleSave()
}

export function getGroupStats(groupId) {
    const db = load()
    return db[groupId] || {}
}

export function clearGroupStats(groupId) {
    const db = load()
    delete db[groupId]
    scheduleSave()
    save()
}