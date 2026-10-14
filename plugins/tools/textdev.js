/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import crypto from 'crypto'
import axios from 'axios'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'

const TAGS = ['tools']
const MAX = 4000
const need = (text, prefix, usage) => (text.trim() ? null : `Contoh:\n${pfxOf(prefix)}${usage}`)
const guardLen = (text) => (text.length > MAX ? `Teks terlalu panjang (maks ${MAX} karakter).` : null)

// Ambil input dari teks command atau teks pesan yang di-reply
const input = (m, text) => (text.trim() || m.quoted?.text || '').trim()

const simple = (names, desc, usage, fn) => cmd({ command: names, desc, tags: TAGS, title: names[0] },
    async (m, { text, prefix, notifReply }) => {
        const data = input(m, text)
        const err = (!data && `Contoh:\n${pfxOf(prefix)}${usage}`) || guardLen(data)
        if (err) return notifReply(err, names[0])
        await notifReply(String(await fn(data)), names[0])
    })

const fromB64 = (s) => {
    const clean = s.replace(/\s+/g, '')
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(clean) || !clean) throw new Error('Input bukan Base64 yang valid.')
    return Buffer.from(clean.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

const list = [
    simple(['base64'], 'Encode teks ke Base64', 'base64 halo', d => Buffer.from(d).toString('base64')),
    simple(['encode'], 'URL-encode teks', 'encode halo dunia', d => encodeURIComponent(d)),
    simple(['decode'], 'Decode URL-encoding / Base64 (b64:)', 'decode halo%20dunia', d => {
        if (/^b64:/i.test(d)) return fromB64(d.slice(4))
        try { return decodeURIComponent(d) } catch { throw new Error('Format URL-encoding tidak valid.') }
    }),
    simple(['md5'], 'Hash MD5', 'md5 teks', d => crypto.createHash('md5').update(d).digest('hex')),
    simple(['sha256'], 'Hash SHA-256', 'sha256 teks', d => crypto.createHash('sha256').update(d).digest('hex')),

    cmd({ command: ['uuid'], desc: 'Buat UUID v4', tags: TAGS, title: 'UUID' },
        async (m, { args, notifReply }) => {
            const n = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10)
            await notifReply(Array.from({ length: n }, () => crypto.randomUUID()).join('\n'), 'UUID')
        }),

    cmd({ command: ['random'], desc: 'Angka acak: .random <min> <max>', tags: TAGS, title: 'Random' },
        async (m, { args, prefix, notifReply }) => {
            const a = args.length >= 2 ? Number(args[0]) : 1
            const b = Number(args.length >= 2 ? args[1] : args[0] ?? 100)
            if (![a, b].every(Number.isSafeInteger) || a > b) return notifReply(`Contoh: ${pfxOf(prefix)}random 1 100`, 'Random')
            await notifReply(`🎲 ${crypto.randomInt(a, b + 1)}`, 'Random')
        }),

    simple(['json', 'beautify'], 'Rapikan JSON', 'beautify {"a":1}', d => '```' + JSON.stringify(JSON.parse(d), null, 2) + '```'),
    simple(['minify'], 'Minify JSON', 'minify {"a": 1}', d => JSON.stringify(JSON.parse(d))),

    cmd({ command: ['timestamp'], desc: 'Unix timestamp <-> tanggal', tags: TAGS, title: 'Timestamp' },
        async (m, { text, notifReply }) => {
            const t = text.trim()
            let date
            if (!t) date = new Date()
            else if (/^\d{9,13}$/.test(t)) date = new Date(t.length <= 10 ? Number(t) * 1000 : Number(t))
            else date = new Date(t)
            if (Number.isNaN(date.getTime())) return notifReply('Format tidak dikenali. Contoh:\n.timestamp 1700000000\n.timestamp 2026-09-29 10:00', 'Timestamp')
            await notifReply(box('TIMESTAMP', [
                `Detik  : ${Math.floor(date.getTime() / 1000)}`,
                `Milidt : ${date.getTime()}`,
                `ISO    : ${date.toISOString()}`,
                `WIB    : ${date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`
            ]), 'Timestamp')
        }),

    cmd({ command: ['regex'], desc: 'Tes regex: .regex /pola/flag teks', tags: TAGS, title: 'Regex' },
        async (m, { text, prefix, notifReply }) => {
            const match = text.match(/^\/((?:\\.|[^/])+)\/([gimsuy]*)\s+([\s\S]+)$/)
            if (!match) return notifReply(`Contoh:\n${pfxOf(prefix)}regex /\\d+/g abc 123 def 45`, 'Regex')
            const [, source, flags, sample] = match
            if (sample.length > 2000 || source.length > 200) return notifReply('Pola/teks terlalu panjang.', 'Regex')
            let re
            try { re = new RegExp(source, flags.includes('g') ? flags : flags + 'g') } catch (e) { return notifReply(`Regex tidak valid: ${e.message}`, 'Regex') }
            // Batasi jumlah hasil & hindari loop tak berujung pada pola kosong
            const found = []
            for (const r of sample.matchAll(re)) { found.push(`${r.index}: ${r[0]}`); if (found.length >= 20) break }
            await notifReply(found.length ? `✅ ${found.length} kecocokan:\n${found.join('\n')}` : '❌ Tidak ada kecocokan.', 'Regex')
        }),

    cmd({ command: ['color', 'hex'], desc: 'Konversi warna HEX <-> RGB', tags: TAGS, title: 'Color' },
        async (m, { text, prefix, notifReply }) => {
            const t = text.trim().toLowerCase()
            let r, g, b
            const hex = t.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/)
            const rgb = t.match(/^(?:rgb\()?\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)?$/)
            if (hex) {
                const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]
                ;[r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
            } else if (rgb && [rgb[1], rgb[2], rgb[3]].every(v => Number(v) <= 255)) {
                ;[r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
            } else return notifReply(`Contoh:\n${pfxOf(prefix)}color #ff69b4\n${pfxOf(prefix)}color 255 105 180`, 'Color')
            const toHex = v => v.toString(16).padStart(2, '0')
            const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2
            const d = mx - mn
            const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
            let h = 0
            if (d) {
                if (mx === r / 255) h = ((g - b) / 255 / d) % 6
                else if (mx === g / 255) h = (b - r) / 255 / d + 2
                else h = (r - g) / 255 / d + 4
                h = Math.round(h * 60); if (h < 0) h += 360
            }
            await notifReply(box('COLOR', [`HEX : #${toHex(r)}${toHex(g)}${toHex(b)}`, `RGB : rgb(${r}, ${g}, ${b})`, `HSL : hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`]), 'Color')
        }),

    cmd({ command: ['calculator', 'calc', 'hitung'], desc: 'Kalkulator (+ - * / % ^ ())', tags: TAGS, title: 'Calculator' },
        async (m, { text, prefix, notifReply }) => {
            const expr = text.trim().replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\^/g, '**')
            if (!expr) return notifReply(`Contoh: ${pfxOf(prefix)}calc (12+8)*3/4`, 'Calculator')
            // Whitelist ketat: hanya angka dan operator, tidak ada identifier -> aman dari code injection
            if (expr.length > 100 || !/^[0-9+\-*/%().\s]+$/.test(expr)) return notifReply('Ekspresi hanya boleh berisi angka dan + - * / % ^ ( )', 'Calculator')
            let result
            try { result = Function(`"use strict"; return (${expr})`)() } catch { return notifReply('Ekspresi tidak valid.', 'Calculator') }
            if (typeof result !== 'number' || !Number.isFinite(result)) return notifReply('Hasil tidak terdefinisi (mis. dibagi nol).', 'Calculator')
            await notifReply(`🧮 ${text.trim()} = *${Number(result.toPrecision(12))}*`, 'Calculator')
        }),

    cmd({ command: ['timezone', 'tz'], desc: 'Waktu di zona tertentu', tags: TAGS, title: 'Timezone' },
        async (m, { text, prefix, notifReply }) => {
            const zone = text.trim() || 'Asia/Jakarta'
            let out
            try {
                out = new Date().toLocaleString('id-ID', { timeZone: zone, dateStyle: 'full', timeStyle: 'long' })
            } catch { return notifReply(`Zona waktu tidak dikenal.\nContoh: ${pfxOf(prefix)}timezone Asia/Tokyo`, 'Timezone') }
            await notifReply(`🕒 *${zone}*\n${out}`, 'Timezone')
        }),

    // Layanan publik tanpa API key: wttr.in (cuaca) & MyMemory (terjemahan). Error jaringan ditampilkan apa adanya.
    cmd({ command: ['weather', 'cuaca'], desc: 'Cuaca kota (wttr.in)', tags: TAGS, title: 'Weather' },
        async (m, { text, prefix, notifReply }) => {
            const city = text.trim()
            if (!city || city.length > 60) return notifReply(`Contoh: ${pfxOf(prefix)}weather Jakarta`, 'Weather')
            let data
            try {
                const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}`, { params: { format: 'j1' }, timeout: 15000 })
                data = res.data
            } catch (e) {
                return notifReply(`Layanan cuaca tidak bisa dihubungi (${e.code || e.response?.status || 'error'}). Coba lagi nanti.`, 'Weather')
            }
            const cur = data?.current_condition?.[0]
            if (!cur) return notifReply('Kota tidak ditemukan.', 'Weather')
            const area = data.nearest_area?.[0]?.areaName?.[0]?.value || city
            await notifReply(box(`CUACA ${area.toUpperCase()}`, [
                `Kondisi   : ${cur.weatherDesc?.[0]?.value || '-'}`,
                `Suhu      : ${cur.temp_C}°C (terasa ${cur.FeelsLikeC}°C)`,
                `Lembap    : ${cur.humidity}%`,
                `Angin     : ${cur.windspeedKmph} km/j`,
                `Tekanan   : ${cur.pressure} hPa`
            ]), 'Weather')
        }),

    cmd({ command: ['translate', 'tr'], desc: 'Terjemahkan: .tr <kode> <teks>', tags: TAGS, title: 'Translate' },
        async (m, { args, prefix, notifReply }) => {
            const to = String(args[0] || '').toLowerCase()
            const body = (args.slice(1).join(' ') || m.quoted?.text || '').trim()
            if (!/^[a-z]{2}(-[a-z]{2})?$/.test(to) || !body) return notifReply(`Contoh:\n${pfxOf(prefix)}tr en selamat pagi\n(atau reply pesan lalu ${pfxOf(prefix)}tr id)`, 'Translate')
            if (body.length > 450) return notifReply('Teks terlalu panjang (maks 450 karakter).', 'Translate')
            let data
            try {
                const res = await axios.get('https://api.mymemory.translated.net/get', { params: { q: body, langpair: `autodetect|${to}` }, timeout: 15000 })
                data = res.data
            } catch (e) {
                return notifReply(`Layanan terjemahan tidak bisa dihubungi (${e.code || e.response?.status || 'error'}).`, 'Translate')
            }
            const out = data?.responseData?.translatedText
            if (!out || data.responseStatus && Number(data.responseStatus) !== 200) return notifReply(`Terjemahan gagal: ${data?.responseDetails || 'respon kosong'}`, 'Translate')
            await notifReply(`🌐 *${to.toUpperCase()}*\n${out}`, 'Translate')
        }),

    cmd({ command: ['shorturl'], desc: 'Perpendek URL (is.gd)', tags: TAGS, title: 'Short URL' },
        async (m, { text, prefix, notifReply }) => {
            const url = text.trim().split(/\s+/)[0]
            if (!/^https?:\/\/\S+\.\S+/i.test(url)) return notifReply(`Contoh: ${pfxOf(prefix)}shorturl https://contoh.com/halaman-panjang`, 'Short URL')
            let data
            try {
                data = (await axios.get('https://is.gd/create.php', { params: { format: 'json', url }, timeout: 15000, validateStatus: () => true })).data
            } catch (e) { return notifReply(`Layanan tidak bisa dihubungi (${e.code || 'error'}).`, 'Short URL') }
            if (!data?.shorturl) return notifReply(`Gagal: ${data?.errormessage || 'respon tidak dikenali'}`, 'Short URL')
            await notifReply(`🔗 ${data.shorturl}`, 'Short URL')
        })
]

export default list[0]
export const handlers = list.slice(1)