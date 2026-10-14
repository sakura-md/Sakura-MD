/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getDb, saveDb } from './db.js'
import { getStore } from './cache.js'
import { getUser } from './users.js'

// Engine game ringan: satu sesi aktif per chat, timeout otomatis, skor/XP/leaderboard.
// Skor = poin permainan (VIRTUAL). Tidak ada uang / taruhan nyata.
const sessions = getStore('game-sessions', 10 * 60 * 1000, 500)
const timers = new Map()
const gameDb = () => getDb('game', { users: {} })
export const saveGame = () => saveDb('game')

export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

function lev(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
    for (let j = 1; j <= b.length; j++) dp[0][j] = j
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    return dp[a.length][b.length]
}

export function player(jid) {
    const u = gameDb().users
    return (u[jid] ||= { score: 0, xp: 0, wins: 0, played: 0 })
}
export function award(jid, score) {
    const p = player(jid)
    p.score += score; p.xp += Math.ceil(score / 2); p.wins++
    saveGame()
    return p
}
export const addPlayed = (jid) => { player(jid).played++; saveGame() }
export const top = (n = 10) => Object.entries(gameDb().users).map(([jid, p]) => ({ jid, ...p })).sort((a, b) => b.score - a.score).slice(0, n)
export const nameOf = (jid) => getUser(jid)?.name || jid.split('@')[0]

export const hasSession = (chat) => !!sessions.get(chat)

export function endSession(chat) {
    sessions.delete(chat)
    if (timers.has(chat)) { clearTimeout(timers.get(chat)); timers.delete(chat) }
}

// spec: { type, answers: [..] | check(text,s), reward, timeout(dtk), reveal(): teks jawaban, multi }
export function startSession(conn, chat, spec) {
    endSession(chat)
    const s = { ...spec, found: new Set(), attempts: 0, startedAt: Date.now() }
    sessions.set(chat, s)
    const t = setTimeout(async () => {
        if (sessions.get(chat) !== s) return
        endSession(chat)
        await conn.sendMessage(chat, { text: `⌛ *Waktu habis!*\n${s.reveal ? s.reveal(s) : ''}` }).catch(() => {})
    }, (spec.timeout || 60) * 1000)
    t.unref?.()
    timers.set(chat, t)
    return s
}

// Dipanggil handler untuk pesan non-command di chat yang punya sesi. true = pesan dipakai sebagai jawaban.
export async function checkAnswer(conn, m) {
    const s = sessions.get(m.chat)
    if (!s || m.fromMe) return false
    const text = String(m.text || '').trim()
    if (!text || text.length > 100) return false
    const reply = (t, opts = {}) => conn.sendMessage(m.chat, { text: t, ...opts }, { quoted: m })

    if (s.type === 'number') {
        if (!/^\d{1,4}$/.test(text)) return false
        const g = Number(text)
        s.attempts++
        if (g === s.target) {
            endSession(m.chat)
            const pts = Math.max(10, s.reward - (s.attempts - 1) * 8)
            award(m.sender, pts)
            await reply(`🎉 Benar! Angkanya *${s.target}* (${s.attempts} tebakan)\n+${pts} skor`)
        } else if (s.attempts >= s.maxAttempts) {
            endSession(m.chat)
            await reply(`❌ Kesempatan habis! Angkanya *${s.target}*.`)
        } else await reply(`${g < s.target ? '⬆️ Lebih besar' : '⬇️ Lebih kecil'}! Sisa ${s.maxAttempts - s.attempts} kesempatan.`)
        return true
    }

    const guess = norm(text)
    if (!guess) return false
    const hit = s.answers.map(norm).find(a => a === guess && !s.found.has(a))
    if (hit) {
        s.found.add(hit)
        const pts = s.reward
        award(m.sender, pts)
        if (s.multi && s.found.size < s.answers.length) {
            await reply(`✅ "${text}" benar! +${pts} skor\nTerjawab ${s.found.size}/${s.answers.length}`)
        } else {
            endSession(m.chat)
            await reply(`🎉 *Benar!* ${s.multi ? 'Semua jawaban terungkap.' : `Jawaban: ${s.answers[0]}`}\n@${m.sender.split('@')[0]} +${pts} skor`, { mentions: [m.sender] })
        }
        return true
    }
    // Hampir benar (selisih 1 huruf) -> beri petunjuk, tanpa membocorkan
    if (!s.multi && guess.length >= 5 && s.answers.some(a => lev(norm(a), guess) === 1)) {
        await reply('🔥 Dikit lagi!')
        return true
    }
    return false
}