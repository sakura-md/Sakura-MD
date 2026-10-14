/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../config.js'
import { plugins } from '../handler.js'

const CATEGORY_LABEL = {
    owner: '👑 Owner', group: '👥 Group', game: '🌸 Game', downloader: '📥 Downloader', proteksi: '🛡️ Proteksi',
    stalker: '🔎 Stalker', cek: '🎯 Cek', primbon: '🔮 Primbon', ephoto: '✨ Ephoto', tools: '🔧 Tools',
    sewa: '💰 Sewa', ai: '🤖 AI', sticker: '🪄 Sticker', rpg: '⚔️ RPG', apk: '📦 APK', anime: '🍥 Anime', ping: '📡 Ping', system: '⚙️ System'
}
export const categoryLabel = (key) => CATEGORY_LABEL[key] || key

export const categoryOf = (h) => {
    if (h.tags?.length) return h.tags[0]
    if (h.download) return 'downloader'
    if (h.owner || h.creator) return 'owner'
    if (h.group) return 'group'
    return 'system'
}

// Semua handler unik yang punya command bernama
export function uniqueHandlers() {
    const seen = new Set()
    const out = []
    for (const h of plugins.values()) {
        if (seen.has(h) || !h.command || h.command instanceof RegExp) continue
        seen.add(h)
        out.push(h)
    }
    return out
}

export function helpDetail(name, prefix) {
    const pfx = prefix || config.prefix?.[0] || '.'
    const key = String(name).toLowerCase().replace(/^[^a-z0-9]+/, '')
    const h = plugins.get(key)
    if (!h) return `Command *${key}* tidak ditemukan.\nLihat daftar: ${pfx}allmenu`
    const names = (Array.isArray(h.command) ? h.command : [h.command]).map(String)
    const access = [h.creator && 'Creator', h.owner && 'Owner', h.premium && 'Premium', h.group && 'Khusus grup'].filter(Boolean)
    return [
        `${categoryLabel(categoryOf(h))}`,
        '',
        `Command:\n${pfx}${names[0]}`,
        names.length > 1 ? `\nAlias:\n${names.slice(1).map(n => pfx + n).join(', ')}` : '',
        `\nDeskripsi:\n${h.desc || h.description || '(belum ada deskripsi)'}`,
        access.length ? `\nAkses:\n${access.join(', ')}` : ''
    ].filter(Boolean).join('\n')
}