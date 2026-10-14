/*
Made By Seikagenou
Telegram : t.me/seikagenou
Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../config.js'

export const box = (title, lines = []) => {
const body = (Array.isArray(lines) ? lines : [lines])
.filter(v => v !== null && v !== undefined && v !== false)

return `╭━━━〔 🌸 ${title} 〕━━━╮\n${body.map(l => `┃ ${l}`).join('\n')}\n╰━━━━━━━━━━━━━━━━━━━━━━╯`

}

export const pfxOf = prefix => prefix || config.prefix?.[0] || '.'

export const num = jid => String(jid || '').split('@')[0].replace(/[^0-9]/g, '')
export const toJid = n => "${String(n).replace(/[^0-9]/g, '')}@s.whatsapp.net"
export const mentionTag = jid => "@${num(jid)}"

export function getTarget(m, args = []) {
const mentioned = m.msg?.contextInfo?.mentionedJid || []
if (mentioned[0]) return mentioned[0]
if (m.quoted?.sender) return m.quoted.sender

const digits = String(args[0] || '').replace(/[^0-9]/g, '')
return digits.length >= 8 ? toJid(digits) : null

}

export const toggleMsg = (on, type = '') => {
const fn = on
? config.toggleMessages?.on
: config.toggleMessages?.off

if (typeof fn === 'function') return fn(type)
return on ? `*✅ ${type} Diaktifkan*` : `*❌ ${type} Dinonaktifkan*`

}

// Contoh command ringkas: .welcome on/off
export const toggleExample = (prefix, command, options = ['on', 'off']) => {
return "*Contoh:* ${prefix}${command} ${options.join('/')}"
}

export const parseOnOff = v => {
const s = String(v || '').toLowerCase()

if (['on', 'aktif', 'enable', '1', 'true'].includes(s)) return true
if (['off', 'nonaktif', 'disable', '0', 'false'].includes(s)) return false

return null

}

export const durationText = ms => {
const s = Math.max(0, Math.floor(ms / 1000))
const d = Math.floor(s / 86400)
const h = Math.floor(s % 86400 / 3600)
const mnt = Math.floor(s % 3600 / 60)

return [d && `${d}d`, h && `${h}h`, mnt && `${mnt}m`]
    .filter(Boolean)
    .join(' ') || `${s}s`

}