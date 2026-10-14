/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

// Deteksi & hitung status grup (fitur "Status Grup" WhatsApp: pesan groupStatusMessageV2).
// Dipakai lib/guard.js (deteksi) dan plugins/proteksi/*antistatus*.js (pengaturan).

import { parseDuration } from './sewa.js'

export const STATUS_DEFAULT_LIMIT = 3
export const STATUS_DEFAULT_WINDOW = 24 * 60 * 60 * 1000 // 24 jam
export const STATUS_MIN_WINDOW = 60 * 1000
export const STATUS_MAX_WINDOW = 30 * 24 * 60 * 60 * 1000
export const STATUS_MAX_LIMIT = 50

const STATUS_KEYS = ['groupStatusMessageV2', 'groupStatusMessage']

// true kalau pesan ini adalah status grup (termasuk yang dibungkus ephemeral / viewOnce)
export function isGroupStatus(m) {
    if (STATUS_KEYS.includes(m?.mtype)) return true
    let msg = m?.message
    for (let i = 0; i < 4 && msg; i++) {
        if (STATUS_KEYS.some(k => msg[k])) return true
        msg = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message || msg.viewOnceMessageV2?.message || null
    }
    return false
}

// 86400000 -> "1 hari", 43200000 -> "12 jam", 5400000 -> "1 jam 30 menit"
export function durationLabel(ms) {
    ms = Math.max(0, Math.floor(Number(ms) || 0))
    if (ms && ms % 3600000 === 0 && ms <= 48 * 3600000) return `${ms / 3600000} jam`

    const units = [['hari', 86400000], ['jam', 3600000], ['menit', 60000], ['detik', 1000]]
    const parts = []
    let rest = ms
    for (const [name, size] of units) {
        const v = Math.floor(rest / size)
        if (v) { parts.push(`${v} ${name}`); rest -= v * size }
        if (parts.length === 2) break
    }
    return parts.join(' ') || '0 detik'
}

// "3" + "24h" -> { limit: 3, windowMs: 86400000 } atau { error }
export function parseStatusSetting(limitArg, windowArg) {
    const limit = Number(String(limitArg ?? '').trim())
    if (!Number.isInteger(limit) || limit < 1 || limit > STATUS_MAX_LIMIT) {
        return { error: `Batas harus angka bulat 1 - ${STATUS_MAX_LIMIT}.` }
    }

    const d = parseDuration(windowArg)
    if (!d || d.permanent) return { error: 'Waktu tidak valid. Contoh: 30m, 12h, 1d, 7d.' }
    if (d.ms < STATUS_MIN_WINDOW || d.ms > STATUS_MAX_WINDOW) return { error: 'Waktu minimal 1 menit dan maksimal 30 hari.' }

    return { limit, windowMs: d.ms }
}

// Catat satu status dari `key` (nomor). Hitungan reset otomatis setelah jendela waktu habis.
export function registerStatus(g, key, now = Date.now()) {
    const limit = Math.min(STATUS_MAX_LIMIT, Math.max(1, Math.floor(Number(g.statusLimit)) || STATUS_DEFAULT_LIMIT))
    const windowMs = Number(g.statusWindow) || STATUS_DEFAULT_WINDOW

    g.statusLog ??= {}
    for (const [k, v] of Object.entries(g.statusLog)) if (!v || now >= Number(v.resetAt)) delete g.statusLog[k]

    const entry = (g.statusLog[key] ??= { count: 0, resetAt: now + windowMs })
    entry.count++

    return {
        count: entry.count,
        limit,
        windowMs,
        resetAt: entry.resetAt,
        remaining: Math.max(0, limit - entry.count),
        exceeded: entry.count > limit
    }
}

export function statusWarningText({ pushname, count, remaining, limit, windowMs }) {
    const time = durationLabel(windowMs)
    return `*Peringatan Status Grup*

Hai ${pushname}

Status grup kamu telah terdeteksi.

• *Status Sekarang:* ${count} status
• *Sisa Kesempatan:* ${remaining} kali
• *Reset:* ${time}

Jika melebihi batas *${limit} status dalam ${time}*, kamu akan *dikeluarkan dari grup* secara otomatis.`
}
