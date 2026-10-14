import config from '../config.js'
import { getDb, saveDb } from './db.js'
import { normText } from './tiktokinfo.js'

const defaults = () => {
    const source = config.verification?.nickname || {}
    const tags = Array.isArray(source.tags) ? source.tags : []
    return {
        enabled: source.enabled !== false,
        mode: source.mode === 'all' ? 'all' : 'any',
        tags: [...new Set(tags.map(v => String(v).trim()).filter(Boolean))].slice(0, 10)
    }
}

const db = () => getDb('verifrules', { groups: {} })

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function normalizeRule(rule = {}) {
    const base = defaults()
    const tags = Array.isArray(rule.tags) ? rule.tags : base.tags
    return {
        enabled: rule.enabled !== undefined ? !!rule.enabled : base.enabled,
        mode: rule.mode === 'all' ? 'all' : 'any',
        tags: [...new Set(tags.map(v => String(v).trim()).filter(Boolean))].slice(0, 10)
    }
}

export function getDefaultVerifRule() {
    return clone(defaults())
}

export function getVerifRule(groupId = '') {
    const state = db()
    if (!groupId) return defaults()
    const saved = state.groups[groupId]
    if (!saved) return defaults()
    const rule = normalizeRule(saved)
    if (JSON.stringify(saved) !== JSON.stringify(rule)) {
        state.groups[groupId] = rule
        saveDb('verifrules')
    }
    return rule
}

export function setVerifRule(groupId, rule) {
    if (!groupId) throw new Error('ID grup tidak valid')
    const normalized = normalizeRule(rule)
    db().groups[groupId] = normalized
    saveDb('verifrules', true)
    return normalized
}

export function resetVerifRule(groupId) {
    if (!groupId) throw new Error('ID grup tidak valid')
    const rule = defaults()
    delete db().groups[groupId]
    saveDb('verifrules', true)
    return rule
}

export function checkNickname(nickname, rule = defaults()) {
    const normalizedNickname = normText(nickname || '')
    const tags = Array.isArray(rule.tags) ? rule.tags.filter(Boolean) : []
    if (rule.enabled === false) return { ok: true, matched: [], normalizedNickname }
    if (!tags.length) return { ok: false, matched: [], normalizedNickname, reason: 'Aturan nickname belum memiliki kata yang diizinkan.' }

    const matched = tags.filter(tag => normalizedNickname.includes(normText(tag)))
    const ok = rule.mode === 'all'
        ? matched.length === tags.length
        : matched.length > 0

    return { ok, matched, normalizedNickname }
}

export function ruleText(rule = defaults()) {
    if (rule.enabled === false) return 'Aturan nickname: OFF'
    const joiner = rule.mode === 'all' ? ' DAN ' : ' ATAU '
    return `Nickname harus mengandung: ${rule.tags.join(joiner)}`
}