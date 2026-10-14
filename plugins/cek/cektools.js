/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import dns from 'dns/promises'
import axios from 'axios'
import { parsePhoneNumber } from 'awesome-phonenumber'
import config from '../../config.js'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, num, box, getTarget, durationText } from '../../lib/format.js'
import { plugins } from '../../handler.js'
import { inspectUrl } from '../../lib/urlcheck.js'
import { ApiError, assertPublicHttpUrl } from '../../lib/api.js'
import { apiKeySummary } from '../../lib/apikeys.js'

const T = { tags: ['cek'] }
const usage = (prefix, s) => `Contoh:\n${pfxOf(prefix)}${s}`
const DOMAIN = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const clean = (s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').split(/[/?#]/)[0]

const list = [
    cmd({ command: ['cekid'], desc: 'ID WhatsApp kamu / target', ...T, title: 'Cek ID' }, async (m, { args, notifReply }) => {
        const target = getTarget(m, args) || m.sender
        await notifReply(box('CEK ID', [`User : ${target}`, `Chat : ${m.chat}`, m.isGroup ? `Tipe : Grup` : `Tipe : Pribadi`]), 'Cek ID')
    }),

    cmd({ command: ['cekgroup', 'cekgc'], desc: 'Info grup (di grup / via link undangan)', ...T, title: 'Cek Grup' }, async (m, { conn, args, prefix, notifReply }) => {
        const link = args.join(' ').match(/chat\.whatsapp\.com\/([A-Za-z0-9]{10,})/i)
        let info
        if (link) info = await conn.groupGetInviteInfo(link[1]).catch(() => null)
        else if (m.isGroup) info = await conn.groupMetadata(m.chat).catch(() => null)
        else return notifReply(`Pakai di grup, atau sertakan link undangan.\n${usage(prefix, 'cekgroup https://chat.whatsapp.com/xxxx')}`, 'Cek Grup')
        if (!info) return notifReply('Grup tidak ditemukan / link tidak valid / sudah dicabut.', 'Cek Grup')
        await notifReply(box('CEK GRUP', [`Nama    : ${info.subject}`, `ID      : ${info.id}`, `Member  : ${info.size ?? info.participants?.length ?? '-'}`, `Dibuat  : ${info.creation ? new Date(info.creation * 1000).toLocaleDateString('id-ID') : '-'}`, `Deskripsi: ${(info.desc || '-').slice(0, 120)}`]), 'Cek Grup')
    }),

    cmd({ command: ['cekuser'], desc: 'Info user yang tersedia untuk bot', ...T, title: 'Cek User' }, async (m, { conn, args, notifReply }) => {
        const target = getTarget(m, args) || m.sender
        const [reg] = await conn.onWhatsApp(target).catch(() => [])
        const status = await conn.fetchStatus(target).catch(() => null)
        const st = Array.isArray(status) ? status[0]?.status : status
        await notifReply(box('CEK USER', [`Nomor      : ${num(target)}`, `Di WhatsApp: ${reg?.exists ? 'Ya' : 'Tidak / tidak diketahui'}`, `Bio        : ${st?.status || '-'}`]), 'Cek User')
    }),

    cmd({ command: ['cekurl'], desc: 'Validasi & status URL', ...T, title: 'Cek URL' }, async (m, { text, prefix, notifReply }) => {
        const url = text.trim().split(/\s+/)[0]
        if (!url) return notifReply(usage(prefix, 'cekurl https://contoh.com'), 'Cek URL')
        const r = await inspectUrl(url)
        await notifReply(box('CEK URL', [`Host   : ${r.host}`, `Status : ${r.final ? r.final.status : 'tidak selesai'}`, `Tipe   : ${r.final?.type || '-'}`, `Waktu  : ${r.ms} ms`, `Redirect: ${r.hops.length - 1}`]), 'Cek URL')
    }),

    cmd({ command: ['cekdomain'], desc: 'DNS domain (A/MX/NS)', ...T, title: 'Cek Domain' }, async (m, { text, prefix, notifReply }) => {
        const d = clean(text)
        if (!DOMAIN.test(d)) return notifReply(usage(prefix, 'cekdomain contoh.com'), 'Cek Domain')
        const q = async (fn) => { try { return await fn() } catch { return [] } }
        const [a, mx, ns] = await Promise.all([q(() => dns.resolve4(d)), q(() => dns.resolveMx(d)), q(() => dns.resolveNs(d))])
        if (!a.length && !mx.length && !ns.length) return notifReply('Domain tidak ditemukan (tidak ada record DNS).', 'Cek Domain')
        await notifReply(box(d.toUpperCase(), [`A  : ${a.slice(0, 4).join(', ') || '-'}`, `MX : ${mx.slice(0, 3).map(x => x.exchange).join(', ') || '-'}`, `NS : ${ns.slice(0, 4).join(', ') || '-'}`, '', 'Catatan: data DNS saja (bukan WHOIS).']), 'Cek Domain')
    }),

    cmd({ command: ['cekemail'], desc: 'Validasi format & MX email', ...T, title: 'Cek Email' }, async (m, { text, prefix, notifReply }) => {
        const e = text.trim().toLowerCase()
        if (!e) return notifReply(usage(prefix, 'cekemail nama@contoh.com'), 'Cek Email')
        const okFormat = /^[a-z0-9._%+-]{1,64}@([a-z0-9-]+\.)+[a-z]{2,63}$/i.test(e) && e.length <= 254
        if (!okFormat) return notifReply('❌ Format email tidak valid.', 'Cek Email')
        const mx = await dns.resolveMx(e.split('@')[1]).catch(() => [])
        await notifReply(box('CEK EMAIL', ['Format : valid', `MX     : ${mx.length ? 'ada (' + mx[0].exchange + ')' : 'tidak ditemukan — domain mungkin tidak menerima email'}`, '', 'Catatan: tidak memastikan kotak surat itu benar-benar ada.']), 'Cek Email')
    }),

    cmd({ command: ['cekip'], desc: 'Info IP publik (ipwho.is)', ...T, title: 'Cek IP' }, async (m, { text, prefix, notifReply }) => {
        const ip = text.trim()
        if (!/^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{3,39}$/i.test(ip)) return notifReply(usage(prefix, 'cekip 8.8.8.8'), 'Cek IP')
        try { assertPublicHttpUrl(`http://${ip.includes(':') ? `[${ip}]` : ip}/`) } catch { return notifReply('Hanya IP publik yang boleh diperiksa (bukan alamat lokal/internal).', 'Cek IP') }
        let d
        try { d = (await axios.get(`https://ipwho.is/${encodeURIComponent(ip)}`, { timeout: 12000 })).data } catch (e) { return notifReply(`Layanan IP tidak bisa dihubungi (${e.code || e.response?.status || 'error'}).`, 'Cek IP') }
        if (!d?.success) return notifReply(`Gagal: ${d?.message || 'IP tidak dikenali'}`, 'Cek IP')
        await notifReply(box('CEK IP', [`IP     : ${d.ip}`, `Negara : ${d.country || '-'}`, `Wilayah: ${d.region || '-'}, ${d.city || '-'}`, `ISP    : ${d.connection?.isp || '-'}`, `ASN    : ${d.connection?.asn || '-'}`, '', 'Lokasi berdasarkan IP hanya perkiraan kasar.']), 'Cek IP')
    }),

    cmd({ command: ['cekphone', 'ceknomor'], desc: 'Validasi format nomor telepon', ...T, title: 'Cek Phone' }, async (m, { text, prefix, notifReply }) => {
        const raw = text.trim()
        if (!raw) return notifReply(usage(prefix, 'cekphone +6281234567890'), 'Cek Phone')
        const p = parsePhoneNumber(raw.startsWith('+') ? raw : `+${raw.replace(/[^0-9]/g, '')}`)
        if (!p.valid) return notifReply('❌ Nomor tidak valid. Sertakan kode negara, contoh: +6281234567890', 'Cek Phone')
        await notifReply(box('CEK NOMOR', [`Internasional: ${p.number.international}`, `Negara       : ${p.regionCode}`, `Tipe         : ${p.typeIsMobile ? 'Seluler' : p.typeIsFixedLine ? 'Telepon rumah' : 'Lainnya'}`, '', 'Hanya validasi format — bukan pengecekan pemilik/aktif.']), 'Cek Phone')
    }),

    cmd({ command: ['cektext'], desc: 'Statistik teks sederhana', ...T, title: 'Cek Text' }, async (m, { text, prefix, notifReply }) => {
        const t = (text.trim() || m.quoted?.text || '').trim()
        if (!t) return notifReply(usage(prefix, 'cektext teks yang mau dianalisis'), 'Cek Text')
        const words = t.split(/\s+/).filter(Boolean)
        const freq = {}
        for (const w of words.map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(w => w.length > 3)) freq[w] = (freq[w] || 0) + 1
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, c]) => `${w}(${c})`).join(', ')
        await notifReply(box('CEK TEXT', [`Karakter : ${t.length}`, `Kata     : ${words.length}`, `Kalimat  : ${(t.match(/[.!?]+(\s|$)/g) || []).length || 1}`, `Baris    : ${t.split('\n').length}`, `Est. baca: ${Math.max(1, Math.round(words.length / 200 * 60))} dtk`, `Sering   : ${top || '-'}`]), 'Cek Text')
    }),

    cmd({ command: ['cekjson'], desc: 'Validasi JSON', ...T, title: 'Cek JSON' }, async (m, { text, prefix, notifReply }) => {
        const t = (text.trim() || m.quoted?.text || '').trim()
        if (!t) return notifReply(usage(prefix, 'cekjson {"a":1}'), 'Cek JSON')
        try {
            const v = JSON.parse(t)
            const type = Array.isArray(v) ? `array (${v.length} item)` : v === null ? 'null' : typeof v === 'object' ? `object (${Object.keys(v).length} key)` : typeof v
            await notifReply(`✅ JSON valid\nTipe: ${type}`, 'Cek JSON')
        } catch (e) { await notifReply(`❌ JSON tidak valid\n${e.message}`, 'Cek JSON') }
    }),

    cmd({ command: ['cekapi'], desc: 'Tes koneksi API + status API key tiap file', owner: true, ...T, title: 'Cek API' }, async (m, { notifReply }) => {
        const base = 'https://api.haidarxd.my.id'
        const keys = apiKeySummary()
        let net
        try {
            const t0 = Date.now()
            const res = await axios.get(base, { timeout: 10000, validateStatus: () => true })
            net = `terhubung (HTTP ${res.status}, ${Date.now() - t0} ms)`
        } catch (e) { net = `gagal (${e.code || 'error'})` }
        const rows = keys.list.map(k => `${k.filled ? '✅' : '❌'} ${k.file}`)
        await notifReply(box('CEK API', [`Server   : ${net}`, `API key  : ${keys.filled}/${keys.total} file terisi`, '', ...rows, '', 'Key diisi di variabel API_KEY pada masing-masing file.']), 'Cek API')
    }),

    cmd({ command: ['cekstatus', 'botstatus'], desc: 'Status layanan internal bot', ...T, title: 'Cek Status' }, async (m, { conn, notifReply }) => {
        const { existsSync } = await import('fs')
        const os = await import('os')
        const keys = apiKeySummary()
        const mem = process.memoryUsage()
        await notifReply(box('STATUS BOT', [
            `Koneksi : ${conn.user ? 'online' : 'offline'}`,
            `Mode    : ${config.botMode}${config.maintenance?.on ? ' (maintenance)' : ''}`,
            `Uptime  : ${durationText(process.uptime() * 1000)}`,
            `Plugin  : ${new Set(plugins.values()).size} handler`,
            `API key : ${keys.filled}/${keys.total} file terisi`,
            `Database: ${existsSync(new URL('../../database', import.meta.url)) ? 'ok' : 'tidak ada'}`,
            `RAM bot : ${(mem.rss / 1048576).toFixed(0)} MB`,
            `Node    : ${process.version} (${os.platform()})`
        ]), 'Cek Status')
    })
]

export default list[0]
export const handlers = list.slice(1)