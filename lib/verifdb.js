import { getDb, saveDb } from './db.js'

const db = () => getDb('verif', { users: {} })
const digits = value => String(value || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '')

export async function resolvePhone(conn, m) {
    const key = m?.key || {}
    const candidates = [m?.sender, key.participantPn, key.participantAlt, key.senderPn, key.remoteJidAlt]

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.endsWith('@s.whatsapp.net')) return digits(candidate)
    }

    try {
        const mapped = await conn.signalRepository?.lidMapping?.getPNForLID?.(m?.sender)
        if (typeof mapped === 'string' && mapped.includes('@s.whatsapp.net')) return digits(mapped)
    } catch {}

    return ''
}

export function findByJid(jid, phone = '') {
    const users = db().users || {}
    if (jid && users[jid]) return users[jid]
    if (phone) return Object.values(users).find(user => digits(user?.phone) === digits(phone)) || null
    return null
}

export const findByTiktok = (username = '') => {
    const target = String(username || '').replace(/^@/, '').toLowerCase()
    if (!target) return null
    return Object.values(db().users || {}).find(user =>
        String(user?.tiktok || '').replace(/^@/, '').toLowerCase() === target
    ) || null
}

export const listVerif = () => Object.values(db().users || {})

export function saveVerif({ jid, phone, waName, tiktok, nickname }) {
    const users = db().users
    const cleanJid = String(jid || '').trim()
    const cleanTikTok = String(tiktok || '').replace(/^@/, '').trim()
    const cleanPhone = digits(phone)

    if (!cleanJid || !cleanTikTok) throw new Error('Data verifikasi tidak lengkap')

    const oldKey = Object.keys(users).find(key =>
        key === cleanJid ||
        (cleanPhone && digits(users[key]?.phone) === cleanPhone) ||
        String(users[key]?.tiktok || '').replace(/^@/, '').toLowerCase() === cleanTikTok.toLowerCase()
    )

    const old = oldKey ? users[oldKey] : null
    if (oldKey && oldKey !== cleanJid) delete users[oldKey]

    users[cleanJid] = {
        jid: cleanJid,
        phone: cleanPhone || old?.phone || '',
        waName: String(waName || old?.waName || '').slice(0, 60),
        tiktok: cleanTikTok,
        nickname: String(nickname || old?.nickname || '').slice(0, 100),
        verifiedAt: old?.verifiedAt || Date.now(),
        updatedAt: Date.now()
    }

    saveDb('verif', true)
    return users[cleanJid]
}

export function removeVerif(jid) {
    const users = db().users
    const old = users[jid]
    if (!old) return null
    delete users[jid]
    saveDb('verif', true)
    return old
}