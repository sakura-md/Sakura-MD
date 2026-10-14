import { getDb, saveDb } from './db.js'

// =========================================================
// BIO RULES
// =========================================================

export const MAX_TEMPLATES = 5
export const MAX_ENTRY_LENGTH = 60
export const MAX_BIO_LENGTH = 139

// Template default.
// {bio} = teks bio yang diberikan user.
//
// Tanpa {bio}:
// template dianggap sebagai tambahan di belakang bio.
//
// Contoh:
// " ✦"        -> "Bio user ✦"
// " | Sakura" -> "Bio user | Sakura"
//
// Dengan {bio}:
// "{bio} ✦ Sakura" -> "Bio user ✦ Sakura"
export const DEFAULT_TEMPLATES = [
    '{bio}',
    '{bio} ✦ Sakura',
    '『{bio}』',
    '꒰ {bio} ꒱',
    '✦ {bio} ✦'
]

const db = () =>
    getDb('biogroups', {
        groups: {}
    })


// =========================================================
// CHARACTER LENGTH
// =========================================================

export const charLength = (text = '') =>
    [...String(text)].length


// =========================================================
// CLEAN TEMPLATE
// =========================================================

const clean = list =>
    [
        ...new Set(
            (Array.isArray(list) ? list : [])
                .map(v => String(v ?? '').trim())
                .filter(Boolean)
                .filter(v => charLength(v) <= MAX_ENTRY_LENGTH)
        )
    ].slice(0, MAX_TEMPLATES)


// =========================================================
// CEK CUSTOM BIO
// =========================================================

export function hasCustomBio(groupId = '') {
    return !!(
        groupId &&
        db().groups[groupId]
    )
}


// =========================================================
// GET TEMPLATE BIO
// =========================================================

export function getBioTemplates(groupId = '') {

    const saved =
        groupId
            ? db().groups[groupId]
            : null

    const list =
        clean(saved?.templates)

    return list.length
        ? list
        : [...DEFAULT_TEMPLATES]
}


// =========================================================
// SET TEMPLATE BIO
// =========================================================

export function setBioTemplates(
    groupId,
    templates,
    by = ''
) {

    if (!groupId) {
        throw new Error(
            'ID grup tidak valid'
        )
    }

    const list =
        clean(templates)

    if (!list.length) {
        throw new Error(
            'Template bio kosong'
        )
    }

    db().groups[groupId] = {
        templates: list,
        updatedAt: Date.now(),
        by: String(by || '')
    }

    saveDb(
        'biogroups',
        true
    )

    return list
}


// =========================================================
// RESET TEMPLATE BIO
// =========================================================

export function resetBioTemplates(groupId) {

    if (!groupId) {
        throw new Error(
            'ID grup tidak valid'
        )
    }

    delete db().groups[groupId]

    saveDb(
        'biogroups',
        true
    )

    return [
        ...DEFAULT_TEMPLATES
    ]
}


// =========================================================
// BUILD SATU BIO
// =========================================================

export const buildBio = (
    bio,
    entry
) => {

    const value =
        String(bio || '').trim()

    const template =
        String(entry || '').trim()

    if (!template) {
        return value
    }

    // Kalau memakai {bio},
    // ganti semua placeholder.
    if (template.includes('{bio}')) {

        return template
            .split('{bio}')
            .join(value)
            .trim()
    }

    // Kalau tidak ada {bio},
    // template dianggap suffix.
    return `${value}${template}`.trim()
}


// =========================================================
// BUILD SEMUA HASIL BIO
// =========================================================

export const buildBioResults = (
    bio,
    groupId = ''
) => {

    return getBioTemplates(
        groupId
    )
        .map(entry =>
            buildBio(
                bio,
                entry
            )
        )
        .filter(Boolean)
        .filter(
            (value, index, arr) =>
                arr.indexOf(value) === index
        )
}


// =========================================================
// PARSE INPUT .SETBIO
// =========================================================
//
// Contoh:
//
// .setbio ✦ Sakura|『{bio}』|꒰ {bio} ꒱
//
// menjadi:
//
// [
//   '✦ Sakura',
//   '『{bio}』',
//   '꒰ {bio} ꒱'
// ]
//

export function parseBioEntries(
    input = ''
) {

    return String(input)
        .split('|')
        .map(v => v.trim())
        .filter(Boolean)
}


// =========================================================
// VALIDASI HASIL BIO
// =========================================================

export function validateBio(
    bio = ''
) {

    const length =
        charLength(bio)

    return {
        valid:
            length <= MAX_BIO_LENGTH,

        length,

        max:
            MAX_BIO_LENGTH
    }
}