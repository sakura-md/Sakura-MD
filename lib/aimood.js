/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getDb, saveDb } from './db.js'

// Database perasaan AI (database/aimood.json), per-user:
//   affection : kedekatan 0..100 (naik pelan lewat ngobrol baik, turun cepat kalau dikasari)
//   score     : suasana hati -100..100, otomatis balik ke netral seiring waktu
//   chats     : total obrolan, lastChat : waktu obrolan terakhir
// Hasilnya dimasukkan ke system prompt supaya jawaban AI ikut bernada sesuai perasaannya.
// Perasaan ini simulasi — AI tetap harus jujur kalau ditanya.
const HOUR = 3600 * 1000
const MOOD_HALF_LIFE = 6 * HOUR
const MISS_AFTER = 12 * HOUR
const START_AFFECTION = 40
const MAX_USERS = 5000

const POSITIVE = /\b(makasih|terima ?kasih|thanks?|thx|tengkyu|mantap|keren|hebat|pintar|pinter|baik banget|lucu|imut|sayang|cinta|love|suka kamu|good job|bagus|gemes|semangat)\b/i
const NEGATIVE = /\b(anj(?:ing|rit)?|goblok|goblog|bego|bodoh|tolol|bangsat|bajingan|tai|sampah|payah|jelek|benci|bacot|kampret|brengsek|idiot|stupid|ngeselin|nyebelin|useless|kontol|memek|asu|diem lu|diam lu)\b/i
const APOLOGY = /\b(maaf|sorry|sori|ampun)\b/i

const db = () => getDb('aimood', { users: {} })
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

function prune(users) {
    const ids = Object.keys(users)
    if (ids.length <= MAX_USERS) return
    ids.sort((a, b) => (users[a].lastChat || 0) - (users[b].lastChat || 0))
    for (const id of ids.slice(0, ids.length - MAX_USERS)) delete users[id]
}

function ensure(m) {
    const users = db().users
    const id = m.sender
    if (!users[id]) {
        users[id] = { name: m.pushName || '', affection: START_AFFECTION, score: 0, chats: 0, firstChat: Date.now(), lastChat: 0 }
        prune(users)
    }
    return users[id]
}

const stageOf = (a) =>
    a >= 90 ? 'sangat sayang & akrab'
        : a >= 70 ? 'sahabat dekat'
            : a >= 45 ? 'teman dekat'
                : a >= 20 ? 'kenalan biasa'
                    : 'masih cuek / belum akrab'

function moodOf(u) {
    if (u.missed && u.score >= -10) return { label: 'kangen karena lama tidak ngobrol', emoji: '🥺' }
    if (u.score >= 40) return { label: 'sangat senang', emoji: '🥰' }
    if (u.score >= 15) return { label: 'senang', emoji: '😊' }
    if (u.score <= -50) return { label: 'sangat kesal', emoji: '😠' }
    if (u.score <= -20) return { label: 'kesal', emoji: '😤' }
    if (u.score <= -8) return { label: 'agak murung', emoji: '😔' }
    return { label: 'tenang', emoji: '🙂' }
}

// Catat satu pesan user: ubah kedekatan & suasana hati, simpan ke database
export function observe(m, text = '') {
    const u = ensure(m)
    const now = Date.now()

    if (u.lastChat) u.score = Math.round(u.score * Math.pow(0.5, (now - u.lastChat) / MOOD_HALF_LIFE))
    u.missed = !!u.lastChat && (now - u.lastChat) >= MISS_AFTER && u.affection >= 45

    const neg = NEGATIVE.test(text)
    const pos = POSITIVE.test(text)
    const sorry = APOLOGY.test(text)

    let dAff = 0.2
    let dScore = 0
    if (neg) { dAff = -4; dScore = -45 }
    else {
        if (pos) { dAff = 2; dScore = 20 }
        if (sorry) { dAff += 1; dScore += u.score < 0 ? 25 : 10 }
    }

    u.affection = Math.round(clamp(u.affection + dAff, 0, 100) * 10) / 10
    u.score = clamp(u.score + dScore, -100, 100)
    u.chats += 1
    u.lastChat = now
    if (m.pushName) u.name = m.pushName
    saveDb('aimood')
    return u
}

// Instruksi perasaan untuk system prompt
export function promptFor(u) {
    const mood = moodOf(u)
    const lines = [
        'Kamu punya perasaan (simulasi) yang memengaruhi nada bicaramu. Ungkapkan secara natural dan singkat, jangan menyebut angka, database, atau "skor".',
        `Suasana hatimu sekarang: ${mood.label}.`,
        `Kedekatanmu dengan pengguna ini: ${stageOf(u.affection)}.`
    ]
    if (u.chats <= 1) lines.push('Ini obrolan pertama kalian, sapa dengan hangat.')
    if (u.missed) lines.push('Kalian sudah lama tidak ngobrol; boleh bilang kangen dengan wajar.')
    if (u.score <= -20) lines.push('Pengguna baru saja kasar. Tegur dengan tegas tapi sopan, jangan balas dengan kata kasar, dan tetap jawab pertanyaannya bila ada. Jika ia minta maaf, maafkan dengan lega.')
    else if (u.score >= 15) lines.push('Kamu sedang ceria, boleh sedikit antusias dan pakai emoji secukupnya.')
    lines.push('Jika ditanya apakah perasaanmu nyata, jawab jujur bahwa kamu AI dan perasaanmu adalah simulasi, tetapi tetap tulus dalam percakapan ini.')
    lines.push('Perasaan tidak boleh mengurangi ketepatan atau kelengkapan jawaban.')
    return lines.join('\n')
}

export function moodReport(m) {
    const u = ensure(m)
    if (u.lastChat) u.score = Math.round(u.score * Math.pow(0.5, (Date.now() - u.lastChat) / MOOD_HALF_LIFE))
    u.missed = !!u.lastChat && (Date.now() - u.lastChat) >= MISS_AFTER && u.affection >= 45
    const mood = moodOf(u)
    const filled = Math.round(u.affection / 10)
    return [
        '💗 *Perasaan Sakura*',
        '',
        `Suasana hati : ${mood.label} ${mood.emoji}`,
        `Hubungan     : ${stageOf(u.affection)}`,
        `Kedekatan    : ${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${Math.round(u.affection)}/100`,
        `Total obrolan: ${u.chats}`
    ].join('\n')
}

export function resetMood(m) {
    const users = db().users
    delete users[m.sender]
    saveDb('aimood', true)
}
