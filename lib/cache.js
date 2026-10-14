/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Store in-memory dengan TTL. Store hidup di modul lib (bukan di plugin) supaya tetap
// dipakai bersama walau plugin di-hot-reload (modul lib tidak ikut di-reload).
const stores = new Map()

class TtlStore {
    constructor(ttlMs, max) {
        this.ttlMs = ttlMs
        this.max = max
        this.map = new Map()
    }

    prune() {
        const now = Date.now()
        for (const [key, item] of this.map) {
            if (item.expires <= now) this.map.delete(key)
        }
        while (this.map.size > this.max) {
            this.map.delete(this.map.keys().next().value)
        }
    }

    set(key, value) {
        this.map.delete(key)
        this.map.set(key, { value, expires: Date.now() + this.ttlMs })
        this.prune()
        return value
    }

    get(key) {
        const item = this.map.get(key)
        if (!item) return undefined
        if (item.expires <= Date.now()) {
            this.map.delete(key)
            return undefined
        }
        return item.value
    }

    delete(key) {
        return this.map.delete(key)
    }
}

export function getStore(name, ttlMs = 15 * 60 * 1000, max = 200) {
    if (!stores.has(name)) stores.set(name, new TtlStore(ttlMs, max))
    return stores.get(name)
}

export function randomToken(length = 8) {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    let out = ''
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}