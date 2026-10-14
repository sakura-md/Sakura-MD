/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getDb, saveDb } from './db.js'

// Statistik pemakaian bot per user (dipakai .mystats, .myactivity, .dashboard, .bcuser, XP/RPG).
// Hanya menyimpan: JID, nama tampilan, jumlah command, waktu pertama/terakhir. Tidak menyimpan isi pesan.
const db = () => getDb('users', { users: {} })

export function trackCommand(jid, command, pushName = '') {
    if (!jid || !command) return
    const users = db().users
    const u = users[jid] || (users[jid] = { firstSeen: Date.now(), lastSeen: 0, name: '', total: 0, commands: {} })
    u.lastSeen = Date.now()
    if (pushName) u.name = String(pushName).slice(0, 40)
    u.total++
    u.commands[command] = (u.commands[command] || 0) + 1
    // Jaga ukuran: simpan maksimal 60 command berbeda per user
    const keys = Object.keys(u.commands)
    if (keys.length > 60) {
        keys.sort((a, b) => u.commands[a] - u.commands[b]).slice(0, keys.length - 60).forEach(k => delete u.commands[k])
    }
    saveDb('users')
}

export const getUser = (jid) => db().users[jid] || null
export const allUsers = () => db().users