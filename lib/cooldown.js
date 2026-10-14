/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Cooldown per key + lock "sedang diproses" (mencegah request paralel dari user yang sama).
const cooldowns = new Map()
const locks = new Set()

function prune(now) {
    if (cooldowns.size < 500) return
    for (const [key, until] of cooldowns) {
        if (until <= now) cooldowns.delete(key)
    }
}

// Return { ok: true } dan mulai cooldown, atau { ok: false, wait } (detik) kalau masih cooldown.
export function checkCooldown(key, seconds) {
    const now = Date.now()
    prune(now)
    const until = cooldowns.get(key) || 0
    if (until > now) return { ok: false, wait: Math.ceil((until - now) / 1000) }
    if (seconds > 0) cooldowns.set(key, now + seconds * 1000)
    return { ok: true }
}

export function resetCooldown(key) {
    cooldowns.delete(key)
}

export function acquireLock(key) {
    if (locks.has(key)) return false
    locks.add(key)
    return true
}

export function releaseLock(key) {
    locks.delete(key)
}