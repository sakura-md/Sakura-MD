/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { checkCooldown } from '../../lib/cooldown.js'
import * as K from '../../lib/gamekit.js'
import * as D from '../../lib/gamedata.js'
import { sendInapp } from '../../lib/inapp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../database/games')
const T = { tags: ['game'] }
const pick = (arr) => arr[crypto.randomInt(arr.length)]
const cooldownHit = (m, name, notifReply) => {
    if (m.isOwner) return false
    const cd = checkCooldown(`game:${name}:${m.sender}`, 4)
    if (cd.ok) return false
    notifReply(`Tunggu ${cd.wait} detik.`, 'Game'); return true
}
const busy = (m, notifReply, prefix) => {
    if (!K.hasSession(m.chat)) return false
    notifReply(`Masih ada game yang berjalan di chat ini. Jawab dulu, atau tunggu waktu habis.`, 'Game'); return true
}

// Game pertanyaan-jawaban dari bank soal
const qa = (name, title, bank, { reward = 30, timeout = 60, fmt = (row) => row[0], answerOf = (row) => [row[1]] } = {}) =>
    cmd({ command: [name], desc: title, ...T, title }, async (m, { conn, prefix, notifReply }) => {
        if (busy(m, notifReply, prefix) || cooldownHit(m, name, notifReply)) return
        const row = pick(bank)
        const answers = answerOf(row)
        K.startSession(conn, m.chat, { type: 'qa', answers, reward, timeout, reveal: () => `Jawaban: *${answers[0]}*` })
        await sendInapp(conn, m, `🌸 *${title.toUpperCase()}*\n\n${fmt(row)}\n\n⏱️ ${timeout} detik • Hadiah ${reward} skor\nKetik jawabanmu langsung (tanpa prefix).`)
    })

// Game bergambar: soal dari database/games/<file>.json ([{ "img": "https://...", "answer": "..." }])
const imageGame = (name, title, file) => cmd({ command: [name], desc: `${title} (butuh data soal)`, ...T, title }, async (m, { conn, prefix, notifReply }) => {
    if (busy(m, notifReply, prefix) || cooldownHit(m, name, notifReply)) return
    let bank = []
    try { bank = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')) } catch {}
    bank = Array.isArray(bank) ? bank.filter(r => r && /^https:\/\//.test(r.img || '') && r.answer) : []
    if (!bank.length) return notifReply(box('GAME', [`❌ Data soal ${title} belum tersedia.`, `Owner perlu mengisi database/games/${file}`, 'Format: [{"img":"https://...","answer":"jawaban"}]']), 'Game')
    const row = pick(bank)
    K.startSession(conn, m.chat, { type: 'qa', answers: [row.answer], reward: 40, timeout: 60, reveal: () => `Jawaban: *${row.answer}*` })
    await conn.sendMessage(m.chat, { image: { url: row.img }, caption: `🌸 *${title.toUpperCase()}*\n\n⏱️ 60 detik • Hadiah 40 skor` }, { quoted: m })
})

const scramble = (w) => { for (let i = 0; i < 20; i++) { const s = [...w].sort(() => Math.random() - 0.5).join(''); if (s !== w) return s } return w }
const RPS = { gunting: '✌️', batu: '✊', kertas: '✋' }
const nowName = (m) => K.nameOf(m.sender)

const list = [
    qa('tebakkata', 'Tebak Kata', D.TEBAKKATA, { fmt: ([q, a]) => `${q}\n(${a.length} huruf)` }),
    cmd({ command: ['susunkata'], desc: 'Susun huruf acak jadi kata', ...T, title: 'Susun Kata' }, async (m, { conn, prefix, notifReply }) => {
        if (busy(m, notifReply, prefix) || cooldownHit(m, 'susunkata', notifReply)) return
        const w = pick(D.SUSUNKATA)
        K.startSession(conn, m.chat, { type: 'qa', answers: [w], reward: 30, timeout: 60, reveal: () => `Jawaban: *${w}*` })
        await sendInapp(conn, m, `🌸 *SUSUN KATA*\n\nSusun huruf ini: *${scramble(w).toUpperCase()}*\n⏱️ 60 detik • Hadiah 30 skor`)
    }),
    qa('asahotak', 'Asah Otak', D.ASAHOTAK, { reward: 35 }),
    qa('siapakahaku', 'Siapakah Aku', D.SIAPAKAHAKU, { reward: 35 }),
    qa('caklontong', 'Cak Lontong (tebak-tebakan)', D.CAKLONTONG, { reward: 30 }),
    qa('kuis', 'Kuis Pengetahuan', D.KUIS, { reward: 25 }),
    qa('tebakbendera', 'Tebak Bendera', D.BENDERA, { reward: 30, fmt: ([flag]) => `Bendera negara apa ini?\n\n${flag}` }),
    imageGame('tebakgambar', 'Tebak Gambar', 'tebakgambar.json'),
    imageGame('tebaklogo', 'Tebak Logo', 'tebaklogo.json'),

    cmd({ command: ['family100'], desc: 'Tebak semua jawaban survei', ...T, title: 'Family 100' }, async (m, { conn, prefix, notifReply }) => {
        if (busy(m, notifReply, prefix) || cooldownHit(m, 'family100', notifReply)) return
        const row = pick(D.FAMILY100)
        K.startSession(conn, m.chat, { type: 'qa', answers: row.a, reward: 20, timeout: 120, multi: true, reveal: () => `Jawaban: ${row.a.join(', ')}` })
        await sendInapp(conn, m, `🌸 *FAMILY 100*\n\n${row.q}\n\nAda ${row.a.length} jawaban. ⏱️ 120 detik • 20 skor per jawaban.`)
    }),

    cmd({ command: ['mathgame', 'math'], desc: 'Soal hitung cepat: .mathgame easy|medium|hard', ...T, title: 'Math Game' }, async (m, { conn, args, prefix, notifReply }) => {
        if (busy(m, notifReply, prefix) || cooldownHit(m, 'math', notifReply)) return
        const level = ['easy', 'medium', 'hard'].includes(String(args[0]).toLowerCase()) ? args[0].toLowerCase() : 'easy'
        const r = (n) => crypto.randomInt(1, n + 1)
        const cfg = { easy: [20, 1], medium: [60, 2], hard: [150, 3] }[level]
        const a = r(cfg[0]), b = r(cfg[0]), c = r(12)
        const exprs = [[`${a} + ${b}`, a + b], [`${a + b} - ${b}`, a], [`${r(12)} × ${c}`, null]]
        let expr, ans
        if (cfg[1] === 1) { const e = pick(exprs.slice(0, 2)); [expr, ans] = e } else if (cfg[1] === 2) { const x = r(12); expr = `${x} × ${c}`; ans = x * c } else { const x = r(20), y = r(15); expr = `${x} × ${y} + ${a}`; ans = x * y + a }
        const reward = { easy: 15, medium: 25, hard: 40 }[level]
        K.startSession(conn, m.chat, { type: 'qa', answers: [String(ans)], reward, timeout: 30, reveal: () => `Jawaban: *${ans}*` })
        await sendInapp(conn, m, `🧮 *MATH GAME* (${level})\n\nBerapa hasil dari:\n*${expr}* ?\n\n⏱️ 30 detik • Hadiah ${reward} skor`)
    }),

    cmd({ command: ['tebakangka'], desc: 'Tebak angka 1-100 (7 kesempatan)', ...T, title: 'Tebak Angka' }, async (m, { conn, prefix, notifReply }) => {
        if (busy(m, notifReply, prefix) || cooldownHit(m, 'tebakangka', notifReply)) return
        const target = crypto.randomInt(1, 101)
        K.startSession(conn, m.chat, { type: 'number', target, maxAttempts: 7, reward: 60, timeout: 90, reveal: () => `Angkanya *${target}*.` })
        await sendInapp(conn, m, '🔢 *TEBAK ANGKA*\n\nAku memikirkan angka 1-100.\nKamu punya 7 kesempatan • 90 detik.\nKetik angkanya langsung!')
    }),

    cmd({ command: ['truth'], desc: 'Pertanyaan truth', ...T, title: 'Truth' }, async (m, { notifReply }) => { await notifReply(`🎭 *TRUTH*\n\n${pick(D.TRUTH)}`, 'Truth') }),
    cmd({ command: ['dare'], desc: 'Tantangan dare', ...T, title: 'Dare' }, async (m, { notifReply }) => { await notifReply(`🔥 *DARE*\n\n${pick(D.DARE)}`, 'Dare') }),

    cmd({ command: ['coinflip', 'koin'], desc: 'Lempar koin: .coinflip [kepala|ekor]', ...T, title: 'Coinflip' }, async (m, { args, notifReply }) => {
        const res = crypto.randomInt(2) ? 'kepala' : 'ekor'
        const g = String(args[0] || '').toLowerCase()
        const line = ['kepala', 'ekor'].includes(g) ? (g === res ? '\n🎉 Tebakanmu benar! +5 skor' : '\n❌ Tebakanmu salah.') : ''
        if (line.includes('benar')) K.award(m.sender, 5)
        await notifReply(`🪙 Hasil: *${res.toUpperCase()}*${line}`, 'Coinflip')
    }),
    cmd({ command: ['dadu', 'dice'], desc: 'Lempar dadu: .dadu [jumlah 1-5]', ...T, title: 'Dadu' }, async (m, { args, notifReply }) => {
        const n = Math.min(5, Math.max(1, parseInt(args[0]) || 1))
        const rolls = Array.from({ length: n }, () => crypto.randomInt(1, 7))
        await notifReply(`🎲 ${rolls.map(v => '⚀⚁⚂⚃⚄⚅'[v - 1] + v).join('  ')}${n > 1 ? `\nTotal: *${rolls.reduce((a, b) => a + b)}*` : ''}`, 'Dadu')
    }),
    cmd({ command: ['guntingbatu', 'suit', 'gbk'], desc: 'Gunting batu kertas lawan bot', ...T, title: 'Suit' }, async (m, { args, prefix, notifReply }) => {
        const me = String(args[0] || '').toLowerCase().replace('gunting', 'gunting')
        if (!RPS[me]) return notifReply(`Contoh: ${pfxOf(prefix)}guntingbatu batu\nPilihan: gunting, batu, kertas`, 'Suit')
        const bot = pick(Object.keys(RPS))
        const win = (me === 'gunting' && bot === 'kertas') || (me === 'batu' && bot === 'gunting') || (me === 'kertas' && bot === 'batu')
        const out = me === bot ? '🤝 Seri!' : win ? '🎉 Kamu menang! +10 skor' : '😜 Bot menang!'
        if (win) K.award(m.sender, 10)
        await notifReply(`Kamu: ${RPS[me]}  vs  Bot: ${RPS[bot]}\n${out}`, 'Suit')
    }),
    cmd({ command: ['slot'], desc: 'Mesin slot virtual (tanpa taruhan)', ...T, title: 'Slot' }, async (m, { notifReply }) => {
        if (cooldownHit(m, 'slot', notifReply)) return
        const sym = ['🍒', '🍋', '🍇', '🔔', '⭐', '🌸']
        const r = [pick(sym), pick(sym), pick(sym)]
        const jackpot = r[0] === r[1] && r[1] === r[2], two = !jackpot && (r[0] === r[1] || r[1] === r[2] || r[0] === r[2])
        if (jackpot) K.award(m.sender, 50); else if (two) K.award(m.sender, 10)
        await notifReply(`🎰 [ ${r.join(' | ')} ]\n\n${jackpot ? '🎉 JACKPOT! +50 skor' : two ? '✨ Dua sama! +10 skor' : '😅 Belum beruntung.'}\n(Skor virtual — bukan uang.)`, 'Slot')
    }),

    cmd({ command: ['score', 'skor'], desc: 'Skor game kamu', ...T, title: 'Score' }, async (m, { notifReply }) => {
        const p = K.player(m.sender)
        await notifReply(box('SCORE', [`Nama  : ${nowName(m)}`, `Skor  : ${p.score}`, `XP    : ${p.xp}`, `Menang: ${p.wins}`]), 'Score')
    }),
    cmd({ command: ['leaderboard', 'lb', 'topgame'], desc: 'Peringkat skor game', ...T, title: 'Leaderboard' }, async (m, { notifReply }) => {
        const t = K.top()
        await notifReply(t.length ? box('LEADERBOARD', t.map((u, i) => `${i + 1}. ${K.nameOf(u.jid)} — ${u.score}`)) : 'Belum ada skor. Mainkan .kuis dulu!', 'Leaderboard')
    }),
    cmd({ command: ['stopgame', 'nyerah'], desc: 'Hentikan game di chat ini', ...T, title: 'Stop Game' }, async (m, { notifReply }) => {
        if (!K.hasSession(m.chat)) return notifReply('Tidak ada game yang berjalan.', 'Stop Game')
        K.endSession(m.chat)
        await notifReply('🛑 Game dihentikan.', 'Stop Game')
    })
]

export default list[0]
export const handlers = list.slice(1)