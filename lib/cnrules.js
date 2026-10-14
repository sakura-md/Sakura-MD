import { getDb, saveDb } from './db.js'

// Template CN per-grup. Satu entri = satu tombol salin.
//   "𝙁𝙪𝙨𝙝𝙞𝙜𝙪𝙧𝙤"        -> ditempel di belakang nama   (Nama𝙁𝙪𝙨𝙝𝙞𝙜𝙪𝙧𝙤)
//   "{nama} 𝖋𝖙 𝙁𝙎𝙍"     -> pola penuh, {nama} diganti nama (dipakai kalau butuh spasi / posisi bebas)
export const MAX_TEMPLATES = 5
export const MAX_ENTRY_LENGTH = 40
export const MAX_NAME_LENGTH = 30

// Hitung karakter yang terlihat (huruf bold-italic Unicode = 2 unit UTF-16, tapi 1 karakter)
export const charLength = (text = '') => [...String(text)].length

export const DEFAULT_TEMPLATES = ['𝙁𝙪𝙨𝙝𝙞𝙜𝙪𝙧𝙤', '〆𝙁𝙎𝙍', '{nama} 𝖋𝖙 𝙁𝙎𝙍']

const db = () => getDb('cngroups', { groups: {} })

const BOLD_ITALIC = {
    A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈',
    N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕',
    a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢',
    n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙮', z: '𝙯'
}

export const toBoldItalic = (text = '') =>
    [...String(text)].map(ch => BOLD_ITALIC[ch] || ch).join('')

const clean = list => [...new Set(
    (Array.isArray(list) ? list : [])
        .map(v => String(v ?? '').trim())
        .filter(v => v && charLength(v) <= MAX_ENTRY_LENGTH)
)].slice(0, MAX_TEMPLATES)

export function hasCustomCn(groupId = '') {
    return !!(groupId && db().groups[groupId])
}

export function getCnTemplates(groupId = '') {
    const saved = groupId ? db().groups[groupId] : null
    const list = clean(saved?.templates)
    return list.length ? list : [...DEFAULT_TEMPLATES]
}

export function setCnTemplates(groupId, templates, by = '') {
    if (!groupId) throw new Error('ID grup tidak valid')
    const list = clean(templates)
    if (!list.length) throw new Error('Template kosong')
    db().groups[groupId] = { templates: list, updatedAt: Date.now(), by: String(by || '') }
    saveDb('cngroups', true)
    return list
}

export function resetCnTemplates(groupId) {
    if (!groupId) throw new Error('ID grup tidak valid')
    delete db().groups[groupId]
    saveDb('cngroups', true)
    return [...DEFAULT_TEMPLATES]
}

// Nama + entri template -> hasil CN
export const buildCn = (nama, entry) =>
    entry.includes('{nama}')
        ? entry.split('{nama}').join(toBoldItalic(nama))
        : `${toBoldItalic(nama)}${entry}`

// Semua hasil CN untuk satu nama pada grup tertentu (grup kosong = default).
// Dipakai oleh .cn DAN preview .setcn supaya keduanya selalu sama.
export const buildCnResults = (nama, groupId = '') =>
    getCnTemplates(groupId).map(entry => buildCn(nama, entry))

// Pecah input "A|B|C" jadi daftar entri; teks biasa (huruf latin) di suffix dipercantik jadi bold italic
export function parseEntries(input = '') {
    return String(input)
        .split('|')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => (v.includes('{nama}') ? v.split('{nama}').map(toBoldItalic).join('{nama}') : toBoldItalic(v)))
}
