/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box, toggleMsg } from '../../lib/format.js'
import { ApiError, truncate } from '../../lib/api.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { findMedia, MB_ } from '../../lib/media.js'
import { uploadBuffer } from '../../lib/uploader.js'
import * as AI from '../../lib/ai.js'
import * as MOOD from '../../lib/aimood.js'
import { sendInapp } from '../../lib/inapp.js'

const T = { tags: ['ai'] }
const BASE = 'Kamu adalah Sakura AI, asisten WhatsApp yang ramah. Jawab dalam bahasa yang sama dengan pengguna, ringkas dan jelas. Untuk permintaan coding, berikan kode yang lengkap dan jangan memotong bagian penting. Jangan mengarang fakta; jika tidak tahu, katakan tidak tahu.'

const errText = (e) => e instanceof ApiError ? e.message : `Terjadi kesalahan: ${String(e?.message || e).split('\n')[0].slice(0, 160)}`

// Jalankan satu permintaan AI dengan cooldown + lock + error handling seragam
export async function runAI(conn, m, notifReply, title, task) {
    if (!m.isOwner) {
        const cd = checkCooldown(`ai:${m.sender}`, config.limits?.cooldown?.ai ?? 8)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai AI lagi.`, title)
    }
    const lock = `ai:${m.sender}`
    if (!acquireLock(lock)) return notifReply('Permintaan AI sebelumnya masih diproses.', title)
    try {
        await react(conn, m, '⏳')
        const answer = await task()
        await sendInapp(conn, m, `🤖 *Sakura AI*\n\n${truncate(answer, 3500)}`)
        await react(conn, m, '✅')
        return answer
    } catch (e) {
        console.error(`[ai:${title}]`, e?.message || e)
        await react(conn, m, '❌')
        await notifReply(box('❌ GAGAL', ['Terjadi kesalahan saat memproses request.', '', `Detail: ${errText(e)}`]), title)
    } finally { releaseLock(lock) }
}

const input = (m, text) => (text.trim() || m.quoted?.text || '').trim()

// Perintah bertugas: sistem prompt khusus + input dari teks atau pesan yang di-reply
const task = ({ names, title, desc, system, example, needText = true }) => cmd({ command: names, desc, ...T, title }, async (m, { conn, text, prefix, notifReply }) => {
    const data = input(m, text)
    if (needText && !data) return notifReply(`Contoh:\n${pfxOf(prefix)}${names[0]} ${example}\n(atau reply pesan lalu ketik ${pfxOf(prefix)}${names[0]})`, title)
    if (data.length > 3000) return notifReply('Teks terlalu panjang (maks 3000 karakter).', title)
    await runAI(conn, m, notifReply, title, () => AI.askAI(data, { system: `${BASE}\n\nTugas: ${system}` }))
})

const chatCmd = (names, title, desc) => cmd({ command: names, desc, ...T, title }, async (m, { conn, args, text, prefix, notifReply }) => {
    const sub = String(args[0] || '').toLowerCase()
    if (names.includes('ai') && ['on', 'off', 'reset'].includes(sub) && args.length === 1) {
        if (sub === 'reset') { AI.resetSession(m); return notifReply('🧹 Riwayat percakapan dihapus.', title) }
        if (sub === 'on' && !AI.aiConfigured()) return notifReply('API AI belum dikonfigurasi. Owner perlu mengisi `API_KEY` Clouvia di lib/ai.js.', title)
        AI.setSession(m, sub === 'on')
        return notifReply(sub === 'on' ? toggleMsg(true, 'Mode AI') + '\nMode percakapan AI aktif untuk kamu di chat ini. Ketik langsung tanpa prefix. Otomatis mati setelah 30 menit tidak aktif, atau ketik .ai off.' : toggleMsg(false, 'Mode AI'), title)
    }
    const q = input(m, text)
    if (!q) return notifReply(`Contoh:\n${pfxOf(prefix)}${names[0]} jelaskan apa itu JavaScript\n\nMode ngobrol: ${pfxOf(prefix)}ai on | off | reset`, title)
    if (q.length > 2000) return notifReply('Pertanyaan terlalu panjang (maks 2000 karakter).', title)
    const feel = MOOD.observe(m, q)
    const ans = await runAI(conn, m, notifReply, title, () => AI.askAI(AI.withHistory(m, q), { system: `${BASE}\n\n${MOOD.promptFor(feel)}` }))
    if (ans) AI.pushHistory(m, q, ans)
})

const imageUrlFrom = async (m, notifReply, title) => {
    const media = findMedia(m, ['image'])
    if (!media) { await notifReply('Kirim/reply gambar dengan caption perintah ini.', title); return null }
    if (media.size > 8 * MB_) { await notifReply('Gambar terlalu besar (maks 8 MB).', title); return null }
    const buf = await media.download()
    return (await uploadBuffer(buf, { filename: `sakura-${Date.now()}.jpg`, mime: media.mime || 'image/jpeg' })).url
}

const list = [
    chatCmd(['ai', 'sakura'], 'AI', 'Tanya AI / mode ngobrol (.ai on|off|reset)'),
    chatCmd(['ask', 'tanya'], 'Ask', 'Tanya jawab singkat'),
    chatCmd(['chat'], 'Chat', 'Ngobrol dengan AI'),

    cmd({ command: ['mood', 'perasaan'], desc: 'Lihat perasaan Sakura AI ke kamu', ...T, title: 'Mood' }, async (m, { notifReply }) => {
        await notifReply(MOOD.moodReport(m), 'Mood')
    }),
    cmd({ command: ['resetmood'], desc: 'Reset perasaan Sakura AI ke kamu', ...T, title: 'Reset Mood' }, async (m, { notifReply }) => {
        MOOD.resetMood(m)
        await notifReply('🧹 Perasaan Sakura ke kamu sudah di-reset.', 'Reset Mood')
    }),

    task({ names: ['explain', 'jelaskan'], title: 'Explain', desc: 'Jelaskan suatu topik dengan sederhana', system: 'Jelaskan topik berikut dengan bahasa sederhana, beri satu contoh.', example: 'cara kerja internet' }),
    task({ names: ['summarize', 'ringkas'], title: 'Summarize', desc: 'Ringkas teks', system: 'Ringkas teks berikut menjadi poin-poin penting yang padat.', example: '<teks panjang>' }),
    cmd({ command: ['aitranslate', 'aitr'], desc: 'Terjemahkan dengan AI: .aitranslate <bahasa> | <teks>', ...T, title: 'AI Translate' }, async (m, { conn, text, prefix, notifReply }) => {
        const [lang, ...rest] = text.split('|')
        const body = (rest.join('|') || m.quoted?.text || '').trim()
        if (!lang.trim() || !body) return notifReply(`Contoh:\n${pfxOf(prefix)}aitranslate Inggris | selamat pagi semuanya`, 'AI Translate')
        await runAI(conn, m, notifReply, 'AI Translate', () => AI.askAI(body.slice(0, 3000), { system: `${BASE}\n\nTugas: Terjemahkan teks berikut ke bahasa ${lang.trim().slice(0, 30)}. Berikan hanya hasil terjemahan.` }))
    }),

    task({ names: ['code', 'buatkode'], title: 'Code', desc: 'Buat kode dari deskripsi', system: 'Tulis kode sesuai permintaan. Beri kode dalam blok ``` dan penjelasan singkat di bawahnya.', example: 'fungsi JavaScript untuk membalik string' }),
    task({ names: ['debug'], title: 'Debug', desc: 'Cari penyebab error', system: 'Analisis error/kode berikut: sebutkan penyebab paling mungkin dan cara memperbaikinya.', example: '<pesan error atau kode>' }),
    task({ names: ['fixcode', 'perbaikikode'], title: 'Fix Code', desc: 'Perbaiki kode bermasalah', system: 'Perbaiki kode berikut. Tampilkan kode hasil perbaikan dalam blok ``` dan daftar singkat apa yang diubah.', example: '<kode>' }),
    task({ names: ['explaincode', 'jelaskankode'], title: 'Explain Code', desc: 'Jelaskan cara kerja kode', system: 'Jelaskan kode berikut baris demi baris secara ringkas dan mudah dipahami.', example: '<kode>' }),

    task({ names: ['rewrite', 'parafrase'], title: 'Rewrite', desc: 'Tulis ulang teks lebih baik', system: 'Tulis ulang teks berikut agar lebih jelas dan enak dibaca tanpa mengubah maknanya. Beri hanya hasil akhir.', example: '<teks>' }),
    task({ names: ['grammar', 'koreksi'], title: 'Grammar', desc: 'Koreksi tata bahasa', system: 'Koreksi ejaan dan tata bahasa teks berikut. Tampilkan versi yang sudah benar, lalu daftar singkat perbaikan.', example: '<teks>' }),
    task({ names: ['ideas', 'ide'], title: 'Ideas', desc: 'Brainstorm ide', system: 'Berikan 7 ide kreatif dan realistis untuk topik berikut, masing-masing satu baris.', example: 'konten Instagram untuk toko kopi' }),
    task({ names: ['caption', 'buatcaption'], title: 'Caption', desc: 'Buat caption media sosial', system: 'Buat 3 pilihan caption menarik (singkat, dengan emoji secukupnya) untuk topik berikut.', example: 'liburan ke pantai' }),

    cmd({ command: ['vision', 'analisagambar'], desc: 'Analisis gambar (reply/kirim gambar)', ...T, title: 'Vision' }, async (m, { conn, text, notifReply }) => {
        if (!AI.aiConfigured()) return notifReply(box('VISION', ['❌ Fitur sementara tidak tersedia.', 'API AI belum dikonfigurasi.', 'Owner: isi `API_KEY` Clouvia di lib/ai.js.']), 'Vision')
        const url = await imageUrlFrom(m, notifReply, 'Vision')
        if (!url) return
        await runAI(conn, m, notifReply, 'Vision', () => AI.askVision(url, text.trim().slice(0, 300) || 'Jelaskan gambar ini secara rinci.'))
    }),
    cmd({ command: ['ocr', 'bacateks'], desc: 'Baca teks dari gambar', ...T, title: 'OCR' }, async (m, { conn, notifReply }) => {
        if (!AI.aiConfigured()) return notifReply(box('OCR', ['❌ Fitur sementara tidak tersedia.', 'API AI belum dikonfigurasi.', 'Owner: isi `API_KEY` Clouvia di lib/ai.js.']), 'OCR')
        const url = await imageUrlFrom(m, notifReply, 'OCR')
        if (!url) return
        await runAI(conn, m, notifReply, 'OCR', async () => (await AI.askOcr(url)) || (() => { throw new ApiError('Tidak ada teks yang terbaca dari gambar.', { code: 'EMPTY_RESPONSE' }) })())
    })
]

export default list[0]
export const handlers = list.slice(1)