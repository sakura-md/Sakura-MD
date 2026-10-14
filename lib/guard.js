/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../config.js'
import { getDb, saveDb } from './db.js'
import { isGroupAdminJid, isBotGroupAdmin, isSameJid } from './myfunc.js'
import { box, num } from './format.js'
import { isGroupStatus, registerStatus, statusWarningText, durationLabel, STATUS_DEFAULT_LIMIT, STATUS_DEFAULT_WINDOW } from './antistatus.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ownerPath = path.join(__dirname, '../database/owner.json')

export const GROUP_DEFAULTS = {
    antilink: 'off',      // 'off' | 'group' (link grup WA) | 'all' (semua URL)
    antispam: false,      // pesan identik berulang
    antiflood: false,     // terlalu banyak pesan dalam waktu singkat
    antitoxic: false,
    antimention: false,   // mention massal
    antisticker: false,
    antimedia: false,     // gambar/video
    antibot: false,       // pesan dari klien bot (heuristik ID pesan)
    antiraid: false,      // banyak member masuk dalam waktu singkat -> grup ditutup sementara
    antistatus: false,    // status grup melebihi batas dalam jendela waktu -> dikeluarkan
    statusLimit: STATUS_DEFAULT_LIMIT,
    statusWindow: STATUS_DEFAULT_WINDOW,
    statusLog: {},        // nomor -> { count, resetAt }
    warnlimit: 3,
    toxicWords: [],
    welcome: { on: false, text: 'Selamat datang @user di *@group* 🌸' },
    goodbye: { on: false, text: 'Sampai jumpa @user 👋' },
    warns: {}
}

export const groupsDb = () => getDb('groups', { chats: {} })

export function getGroup(groupId) {
    const db = groupsDb()
    if (!db.chats[groupId]) db.chats[groupId] = JSON.parse(JSON.stringify(GROUP_DEFAULTS))
    const g = db.chats[groupId]
    for (const [k, v] of Object.entries(GROUP_DEFAULTS)) if (g[k] === undefined) g[k] = JSON.parse(JSON.stringify(v))
    return g
}
export const saveGroups = () => saveDb('groups')

// Cache metadata grup 60 detik supaya guard tidak memanggil WhatsApp di setiap pesan
const metaCache = new Map()
export async function getMeta(conn, groupId, force = false) {
    const hit = metaCache.get(groupId)
    if (!force && hit && Date.now() - hit.at < 60000) return hit.data
    const data = await conn.groupMetadata(groupId).catch(() => null)
    if (data) metaCache.set(groupId, { at: Date.now(), data })
    return data
}
export const dropMeta = (groupId) => metaCache.delete(groupId)

function isPrivileged(conn, m) {
    const n = num(m.sender)
    if (!n) return false
    const creators = [num(conn.user?.id), ...(config.creator || []).map(num)]
    if (creators.includes(n)) return true
    try {
        const owners = JSON.parse(fs.readFileSync(ownerPath, 'utf8'))
        return owners.map(num).includes(n)
    } catch { return false }
}

// ---- Warning ---------------------------------------------------------------
export async function addWarn(conn, m, target, reason, meta) {
    const g = getGroup(m.chat)
    const key = num(target)
    g.warns[key] = (g.warns[key] || 0) + 1
    const count = g.warns[key]
    const limit = Number(g.warnlimit) || 3
    saveGroups()

    const lines = [`User    : @${key}`, `Alasan  : ${reason}`, `Warning : ${count}/${limit}`]
    if (count >= limit) lines.push('', 'Batas warning tercapai — tindakan moderasi dijalankan.')
    await conn.sendMessage(m.chat, { text: box('⚠️ WARNING', lines), mentions: [target] }).catch(() => {})

    if (count >= limit) {
        delete g.warns[key]
        saveGroups()
        if (meta && isBotGroupAdmin(meta, conn) && !isGroupAdminJid(meta.participants, target)) {
            await conn.groupParticipantsUpdate(m.chat, [target], 'remove').catch(e => console.error('[guard] kick gagal:', e?.message))
        }
    }
    return count
}

async function removeMessage(conn, m) {
    await conn.sendMessage(m.chat, { delete: m.key }).catch(() => {})
}

// ---- Deteksi ---------------------------------------------------------------
const GROUP_LINK = /chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/i
const ANY_LINK = /(https?:\/\/|www\.)[^\s]+/i
const flood = new Map() // key -> [timestamps]
const lastText = new Map() // key -> {text, count, at}

function floodHit(key, max, windowMs) {
    const now = Date.now()
    const arr = (flood.get(key) || []).filter(t => now - t < windowMs)
    arr.push(now)
    flood.set(key, arr)
    if (flood.size > 2000) for (const [k, v] of flood) if (!v.length || now - v[v.length - 1] > windowMs) flood.delete(k)
    return arr.length > max
}

// Status grup: peringatan tiap status; melebihi batas dalam jendela waktu -> dikeluarkan.
async function handleStatus(conn, m, g, meta, botAdmin) {
    const key = num(m.sender)
    const r = registerStatus(g, key)
    saveGroups()

    if (!r.exceeded) {
        await conn.sendMessage(m.chat, {
            text: statusWarningText({ pushname: m.pushName || key, ...r })
        }).catch(() => {})
        return false
    }

    delete g.statusLog[key]
    saveGroups()

    await conn.sendMessage(m.chat, {
        text: box('🚫 BATAS STATUS TERLAMPAUI', [
            `User  : @${key}`,
            `Batas : ${r.limit} status dalam ${durationLabel(r.windowMs)}`,
            '',
            botAdmin ? 'Member dikeluarkan dari grup.' : 'Bot bukan admin, member tidak bisa dikeluarkan.'
        ]),
        mentions: [m.sender]
    }).catch(() => {})

    if (botAdmin) {
        await removeMessage(conn, m)
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(e => console.error('[guard] kick gagal:', e?.message))
    }
    return true
}

// Return true kalau pesan sudah ditangani (dihapus) dan pipeline command harus berhenti.
export async function runGuard(conn, m) {
    try {
        if (!m.isGroup || m.fromMe || !m.sender) return false
        const g = getGroup(m.chat)
        const active = g.antilink !== 'off' || g.antispam || g.antiflood || g.antitoxic || g.antimention || g.antisticker || g.antimedia || g.antibot || g.antistatus
        if (!active) return false
        if (isPrivileged(conn, m)) return false

        const meta = await getMeta(conn, m.chat)
        if (!meta) return false
        if (isGroupAdminJid(meta.participants, m.sender)) return false
        const botAdmin = isBotGroupAdmin(meta, conn)
        const text = String(m.text || '')
        const hit = async (reason, { warn = true } = {}) => {
            if (botAdmin) await removeMessage(conn, m)
            if (warn) await addWarn(conn, m, m.sender, reason, meta)
            return true
        }

        if (g.antistatus && isGroupStatus(m)) return handleStatus(conn, m, g, meta, botAdmin)

        if (g.antibot && m.id && /^BAE5/.test(m.id)) return hit('Terdeteksi pesan dari klien bot')

        if (g.antilink !== 'off') {
            const re = g.antilink === 'all' ? ANY_LINK : GROUP_LINK
            if (re.test(text)) return hit(g.antilink === 'all' ? 'Mengirim link' : 'Mengirim link grup WhatsApp')
        }

        if (g.antisticker && m.mtype === 'stickerMessage') return hit('Mengirim sticker', { warn: false })
        if (g.antimedia && ['imageMessage', 'videoMessage'].includes(m.mtype)) return hit('Mengirim media', { warn: false })

        if (g.antimention) {
            const mentioned = m.msg?.contextInfo?.mentionedJid || []
            if (mentioned.length >= 15) return hit('Mention massal')
        }

        if (g.antitoxic && text && g.toxicWords.length) {
            const lower = text.toLowerCase()
            const found = g.toxicWords.find(w => new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}\\p{N}]|$)`, 'iu').test(lower))
            if (found) return hit('Kata terlarang')
        }

        if (g.antiflood && floodHit(`${m.chat}:${m.sender}`, 6, 6000)) {
            flood.delete(`${m.chat}:${m.sender}`)
            return hit('Flood pesan')
        }

        if (g.antispam && text.length > 1) {
            const key = `${m.chat}:${m.sender}`
            const prev = lastText.get(key)
            const now = Date.now()
            if (prev && prev.text === text && now - prev.at < 30000) {
                prev.count++
                prev.at = now
                if (prev.count >= 4) { lastText.delete(key); return hit('Spam (pesan berulang)') }
            } else lastText.set(key, { text, count: 1, at: now })
            if (lastText.size > 2000) for (const [k, v] of lastText) if (now - v.at > 30000) lastText.delete(k)
        }
        return false
    } catch (e) {
        console.error('[guard] error:', e?.message || e)
        return false
    }
}

// ---- Welcome / goodbye / antiraid (dipanggil dari group-participants.update) ----
const joinLog = new Map()
export async function onParticipants(conn, ev) {
    try {
        const { id, participants = [], action } = ev
        if (!id?.endsWith('@g.us')) return
        dropMeta(id)
        const g = getGroup(id)
        const meta = await getMeta(conn, id, true)
        const subject = meta?.subject || 'grup'
        const jids = participants.map(p => (typeof p === 'string' ? p : p?.id)).filter(Boolean)

        if (action === 'add' && g.antiraid) {
            const now = Date.now()
            const log = (joinLog.get(id) || []).filter(t => now - t < 30000)
            log.push(...jids.map(() => now))
            joinLog.set(id, log)
            if (log.length >= 8 && meta && isBotGroupAdmin(meta, conn)) {
                await conn.groupSettingUpdate(id, 'announcement').catch(() => {})
                await conn.sendMessage(id, { text: box('🛡️ ANTIRAID', ['Terdeteksi banyak member masuk sekaligus, grup ditutup sementara, admin bisa membuka dengan .open']) }).catch(() => {})
            }
        }

        const cfg = action === 'add' ? g.welcome : action === 'remove' ? g.goodbye : null
        if (!cfg?.on) return
        for (const jid of jids) {
            const text = String(cfg.text || '').replace(/@user/gi, `@${num(jid)}`).replace(/@group/gi, subject)
            await conn.sendMessage(id, { text, mentions: [jid] }).catch(() => {})
        }
    } catch (e) {
        console.error('[guard] participants error:', e?.message || e)
    }
}