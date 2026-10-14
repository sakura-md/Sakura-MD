/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import * as P from '../../lib/primbonlib.js'

const T = { tags: ['primbon'] }
const NOTE = '✨ Catatan: hasil ini hanya untuk hiburan, bukan fakta pasti atau dasar keputusan penting.'
const frame = (title, lines) => `${box(`PRIMBON ${title}`, lines)}\n\n${NOTE}`

// Ambil tanggal dari argumen; kalau kosong pakai hari ini (Asia/Jakarta)
const dateArg = (text, allowToday = true) => {
    const t = text.trim()
    if (!t) return allowToday ? P.todayJakarta() : null
    return P.parseDate(t)
}
const BAD = (prefix, ex) => `Format tanggal tidak dikenali.\nContoh: ${pfxOf(prefix)}${ex}\n(DD-MM-YYYY, mis. 17-08-1990)`

const list = [
    cmd({ command: ['weton'], desc: 'Weton dari tanggal lahir', ...T, title: 'Weton' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'weton 17-08-1990'), 'Weton')
        const w = P.weton(d)
        await notifReply(frame('WETON', [`Tanggal : ${P.fmtDate(d)}`, `Weton   : ${w.hari} ${w.pasaran}`, `Neptu   : ${w.neptu} (${w.hari} ${w.neptuHari} + ${w.pasaran} ${w.neptuPasaran})`]), 'Weton')
    }),

    cmd({ command: ['neptu'], desc: 'Hitung neptu dari tanggal', ...T, title: 'Neptu' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'neptu 17-08-1990'), 'Neptu')
        const w = P.weton(d)
        await notifReply(frame('NEPTU', [`Hari    : ${w.hari} = ${w.neptuHari}`, `Pasaran : ${w.pasaran} = ${w.neptuPasaran}`, `Total   : ${w.neptu}`]), 'Neptu')
    }),

    cmd({ command: ['hari'], desc: 'Hari & pasaran dari tanggal (default hari ini)', ...T, title: 'Hari' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text)
        if (!d) return notifReply(BAD(prefix, 'hari 17-08-1945'), 'Hari')
        const w = P.weton(d)
        await notifReply(frame('HARI', [`Tanggal : ${P.fmtDate(d)}`, `Hari    : ${w.hari}`, `Pasaran : ${w.pasaran}`]), 'Hari')
    }),
    cmd({ command: ['tanggal'], desc: 'Tanggal hari ini + weton', ...T, title: 'Tanggal' }, async (m, { notifReply }) => {
        const d = P.todayJakarta(), w = P.weton(d)
        await notifReply(frame('HARI INI', [`Tanggal : ${P.fmtDate(d)}`, `Hari    : ${w.hari}`, `Weton   : ${w.hari} ${w.pasaran}`, `Neptu   : ${w.neptu}`]), 'Tanggal')
    }),

    cmd({ command: ['jodoh'], desc: 'Kecocokan 2 tanggal lahir', ...T, title: 'Jodoh' }, async (m, { args, prefix, notifReply }) => {
        const [a, b] = [P.parseDate(args[0]), P.parseDate(args[1])]
        if (!a || !b) return notifReply(`Contoh: ${pfxOf(prefix)}jodoh 17-08-1990 05-03-1992\n(dua tanggal lahir, format DD-MM-YYYY)`, 'Jodoh')
        const wa = P.weton(a), wb = P.weton(b)
        const total = wa.neptu + wb.neptu
        const [nama, arti] = P.JODOH[total % 4]
        await notifReply(frame('JODOH', [`Orang 1 : ${wa.hari} ${wa.pasaran} (${wa.neptu})`, `Orang 2 : ${wb.hari} ${wb.pasaran} (${wb.neptu})`, `Total   : ${total} → *${nama}*`, '', arti]), 'Jodoh')
    }),

    cmd({ command: ['sifat'], desc: 'Gambaran sifat dari weton', ...T, title: 'Sifat' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'sifat 17-08-1990'), 'Sifat')
        const w = P.weton(d)
        await notifReply(frame('SIFAT', [`Weton : ${w.hari} ${w.pasaran}`, '', `Hari ${w.hari}: ${P.SIFAT_HARI[w.hari]}`, `Pasaran ${w.pasaran}: ${P.SIFAT_PASARAN[w.pasaran]}`]), 'Sifat')
    }),

    cmd({ command: ['rejeki'], desc: 'Gambaran rezeki dari weton', ...T, title: 'Rejeki' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'rejeki 17-08-1990'), 'Rejeki')
        const w = P.weton(d)
        const tiers = [
            [16, 'Rezeki cenderung mengalir lewat kerja keras yang konsisten; cocok menabung sedikit demi sedikit.'],
            [14, 'Rezeki stabil; peluang datang dari relasi dan kepercayaan orang lain.'],
            [12, 'Rezeki naik-turun; perencanaan keuangan yang rapi akan sangat membantu.'],
            [0, 'Rezeki datang lewat ketekunan; hindari pengeluaran impulsif.']
        ]
        const text2 = tiers.find(([min]) => w.neptu >= min)[1]
        await notifReply(frame('REJEKI', [`Weton : ${w.hari} ${w.pasaran} (neptu ${w.neptu})`, '', text2]), 'Rejeki')
    }),

    cmd({ command: ['nasib'], desc: 'Gambaran nasib dari weton', ...T, title: 'Nasib' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'nasib 17-08-1990'), 'Nasib')
        const w = P.weton(d)
        const arr = [
            'Perjalanan hidup banyak dipengaruhi keputusan berani di usia muda.',
            'Hidup cenderung tenang; keberuntungan datang lewat kesabaran.',
            'Banyak kesempatan datang dari lingkungan pertemanan yang baik.',
            'Ada masa sulit di awal yang menempa, lalu stabil belakangan.',
            'Nasib baik mengikuti kerja tekun dan sikap rendah hati.'
        ]
        await notifReply(frame('NASIB', [`Weton : ${w.hari} ${w.pasaran}`, '', arr[w.neptu % arr.length]]), 'Nasib')
    }),

    cmd({ command: ['zodiak'], desc: 'Zodiak dari tanggal lahir', ...T, title: 'Zodiak' }, async (m, { text, prefix, notifReply }) => {
        const d = dateArg(text, false)
        if (!d) return notifReply(BAD(prefix, 'zodiak 17-08-1990'), 'Zodiak')
        await notifReply(`♈ Zodiak untuk ${P.fmtDate(d)}: *${P.zodiak(d)}*`, 'Zodiak')
    }),

    cmd({ command: ['shio'], desc: 'Shio dari tahun lahir', ...T, title: 'Shio' }, async (m, { text, prefix, notifReply }) => {
        const y = parseInt(text.trim().match(/\d{4}$/)?.[0] ?? '')
        if (!y || y < 1900 || y > 2100) return notifReply(`Contoh: ${pfxOf(prefix)}shio 1995 (atau tanggal lengkap)`, 'Shio')
        await notifReply(`🐲 Shio tahun ${y}: *${P.shio(y)}*\n\nCatatan: dihitung dari tahun Masehi; kelahiran Januari–Februari sebelum Imlek bisa masuk shio tahun sebelumnya.`, 'Shio')
    }),

    cmd({ command: ['ramalan'], desc: 'Ramalan harian iseng (berubah tiap hari)', ...T, title: 'Ramalan' }, async (m, { text, notifReply }) => {
        const d = P.todayJakarta(), w = P.weton(d)
        const seed = P.hashStr(`${P.fmtDate(d)}|${m.sender}|${text.trim()}`)
        const pick = (arr, k) => arr[(seed >>> k) % arr.length]
        const lines = [
            `Tanggal : ${P.fmtDate(d)} (${w.hari} ${w.pasaran})`,
            '',
            `💼 Karier : ${pick(['Fokus pada satu tugas penting dulu.', 'Tawarkan ide, jangan ragu.', 'Rapikan hal kecil yang tertunda.', 'Kolaborasi membawa hasil.'], 3)}`,
            `❤️ Hati   : ${pick(['Dengarkan lebih banyak.', 'Kabari orang yang kamu sayang.', 'Jangan terburu-buru menyimpulkan.', 'Hari baik untuk berdamai.'], 7)}`,
            `💰 Uang   : ${pick(['Tahan belanja impulsif.', 'Cek catatan pengeluaranmu.', 'Peluang kecil bisa muncul.', 'Sisihkan sedikit untuk tabungan.'], 11)}`,
            `🍀 Angka  : ${(seed % 90) + 10}`
        ]
        await notifReply(frame('RAMALAN', lines), 'Ramalan')
    })
]

export default list[0]
export const handlers = list.slice(1)