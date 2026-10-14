/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getDb, saveDb } from './db.js'
import { getUser } from './users.js'

// RPG ringan berbasis database lokal. Mata uang = "gold" VIRTUAL (tidak ada nilai uang asli).
const db = () => getDb('rpg', { users: {} })
export const saveRpg = () => saveDb('rpg')

export const WEAPONS = {
    pedang_kayu: { name: 'Pedang Kayu', atk: 3, price: 200 },
    pedang_besi: { name: 'Pedang Besi', atk: 8, price: 900 },
    pedang_baja: { name: 'Pedang Baja', atk: 15, price: 3000 }
}
export const ARMORS = {
    baju_kulit: { name: 'Baju Kulit', def: 2, price: 200 },
    baju_besi: { name: 'Baju Besi', def: 6, price: 900 },
    baju_baja: { name: 'Baju Baja', def: 12, price: 3000 }
}
export const CONSUMABLES = { potion: { name: 'Potion', heal: 50, price: 100 } }
export const RESOURCES = {
    daging: { name: 'Daging', sell: 25 }, ikan: { name: 'Ikan', sell: 20 }, batu: { name: 'Batu', sell: 8 },
    besi: { name: 'Bijih Besi', sell: 35 }, emas: { name: 'Bijih Emas', sell: 90 }, permata: { name: 'Permata', sell: 250 }
}
export const ALL_ITEMS = { ...WEAPONS, ...ARMORS, ...CONSUMABLES, ...RESOURCES }

export const xpNeed = (level) => 100 + (level - 1) * 75
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export function getPlayer(jid) {
    const users = db().users
    if (!users[jid]) users[jid] = { level: 1, xp: 0, gold: 250, health: 100, inventory: {}, weapon: null, armor: null, weaponLv: 0, armorLv: 0, cd: {}, lastDaily: 0, streak: 0, wins: 0, losses: 0 }
    const p = users[jid]
    p.cd ||= {}; p.inventory ||= {}
    return p
}

export const maxHealth = (p) => 100 + (p.level - 1) * 10
export const attack = (p) => 5 + (p.level - 1) * 2 + (p.weapon ? WEAPONS[p.weapon].atk + p.weaponLv * 2 : 0)
export const defense = (p) => 1 + Math.floor((p.level - 1) / 2) + (p.armor ? ARMORS[p.armor].def + p.armorLv * 1 : 0)

export function addXp(p, amount) {
    p.xp += amount
    let up = 0
    while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; up++; p.health = maxHealth(p) }
    return up
}

export function addItem(p, key, n = 1) { p.inventory[key] = (p.inventory[key] || 0) + n }
export function takeItem(p, key, n = 1) {
    if ((p.inventory[key] || 0) < n) return false
    p.inventory[key] -= n
    if (p.inventory[key] <= 0) delete p.inventory[key]
    return true
}

// Cooldown per aksi (detik). Return sisa detik, atau 0 kalau boleh dan langsung mulai cooldown.
export function useCooldown(p, action, seconds) {
    const left = Math.ceil(((p.cd[action] || 0) - Date.now()) / 1000)
    if (left > 0) return left
    p.cd[action] = Date.now() + seconds * 1000
    return 0
}

export const displayName = (jid) => getUser(jid)?.name || jid.split('@')[0]
export const topBy = (fn, n = 10) => Object.entries(db().users).map(([jid, p]) => ({ jid, p, v: fn(p) })).sort((a, b) => b.v - a.v).slice(0, n)
export const bar = (v, max, len = 10) => { const f = Math.max(0, Math.min(len, Math.round((v / max) * len))); return '█'.repeat(f) + '░'.repeat(len - f) }