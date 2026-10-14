/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { getStore } from '../../lib/cache.js'
import { checkCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { tempmail } from '../../lib/scrape/tempmail.js'

const T = { tags: ['tools'] }
const TITLE = 'Temp Mail'
const EMAIL = /^[a-z0-9_.-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i

// Email terakhir yang dibuat tiap user (disimpan 6 jam di memori)
const last = getStore('tempmail-last', 6 * 60 * 60 * 1000, 1000)
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

const pickEmail = (m, args) => {
    const given = args.find(a => EMAIL.test(a))
    return (given || last.get(m.sender) || '').toLowerCase()
}

const cooldown = (m, notifReply, key, sec) => {
    if (m.isOwner) return true
    const cd = checkCooldown(`tm:${key}:${m.sender}`, sec)
    if (cd.ok) return true
    notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    return false
}

const tempmailNew = cmd({ command: ['tempmail', 'tmpmail', 'emailgen'], desc: 'Buat email sementara', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    if (!cooldown(m, notifReply, 'new', config.limits?.cooldown?.tempmail ?? 5)) return
    const pfx = pfxOf(prefix)
    if (args[0] === 'domain' || args[0] === 'domains') {
        const list = await tempmail.getActiveDomains()
        return notifReply(box('DOMAIN TEMPMAIL', [...list.slice(0, 15).map(d => `• ${d}`), '', `Pakai: ${pfx}tempmail <username> <domain>`]), TITLE)
    }
    const email = await tempmail.generateEmail(args[0] || null, args[1] || null)
    last.set(m.sender, email)
    await notifReply(box('EMAIL SEMENTARA', [
        `Email : ${email}`,
        '',
        `Cek inbox : ${pfx}tempmailinbox`,
        `Tunggu OTP: ${pfx}tempmailotp`,
        `Baca pesan: ${pfx}tempmailread <nomor>`,
        '',
        'Jangan dipakai untuk akun penting. Inbox bersifat publik.'
    ]), TITLE)
})

const tempmailInbox = cmd({ command: ['tempmailinbox', 'tminbox', 'cekinbox'], desc: 'Lihat inbox email sementara', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const email = pickEmail(m, args)
    if (!email) return notifReply(`Buat email dulu: ${pfxOf(prefix)}tempmail\natau: ${pfxOf(prefix)}tempmailinbox nama@domain.com`, TITLE)
    if (!cooldown(m, notifReply, 'inbox', config.limits?.cooldown?.tempmail ?? 5)) return
    const r = await tempmail.checkInbox(email)
    if (r.status !== 'success') return notifReply(`❌ ${r.message || 'Gagal membaca inbox.'}`, TITLE)
    const d = r.data
    if (!d.messages.length) return notifReply(box('INBOX KOSONG', [`Email : ${email}`, 'Belum ada pesan masuk.', '', `Tunggu OTP otomatis: ${pfxOf(prefix)}tempmailotp`]), TITLE)
    const rows = d.messages.slice(0, 10).map((x, i) => `${i + 1}. ${clip(x.subject, 40) || '(tanpa subjek)'}\n┃    dari: ${clip(x.from, 30)}  ${clip(x.date, 20)}`)
    await notifReply(box(`INBOX (${d.total_messages})`, [`Email : ${email}`, '', ...rows, '', d.otp && `OTP terdeteksi: ${d.otp}`, `Baca isi: ${pfxOf(prefix)}tempmailread <nomor>`]), TITLE)
})

const tempmailRead = cmd({ command: ['tempmailread', 'tmread', 'bacaemail'], desc: 'Baca isi pesan inbox (nomor)', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const email = pickEmail(m, args)
    const no = parseInt(args.find(a => /^\d{1,2}$/.test(a)) || '1', 10)
    if (!email) return notifReply(`Buat email dulu: ${pfxOf(prefix)}tempmail`, TITLE)
    if (!cooldown(m, notifReply, 'read', config.limits?.cooldown?.tempmail ?? 5)) return
    const inbox = await tempmail.checkInbox(email)
    if (inbox.status !== 'success') return notifReply(`❌ ${inbox.message || 'Gagal membaca inbox.'}`, TITLE)
    const item = inbox.data.messages[no - 1]
    if (!item?.link) return notifReply(`Pesan nomor ${no} tidak ditemukan. Cek daftar: ${pfxOf(prefix)}tempmailinbox`, TITLE)
    const r = await tempmail.readMessage(email, item.link)
    if (r.status !== 'success') return notifReply(`❌ ${r.message || 'Gagal membaca pesan.'}`, TITLE)
    const d = r.data
    const plain = String(d.body || '').replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    await notifReply(box('PESAN', [
        `Dari   : ${clip(d.from || item.from, 60)}`,
        `Subjek : ${clip(d.subject || item.subject, 80)}`,
        d.otp && `OTP    : ${d.otp}`,
        d.verification_link && `Link   : ${d.verification_link}`,
        '',
        clip(plain, 800)
    ]), TITLE)
})

const tempmailOtp = cmd({ command: ['tempmailotp', 'tmotp'], desc: 'Tunggu email masuk & ambil OTP/link', ...T, title: TITLE }, async (m, { conn, args, prefix, notifReply }) => {
    const email = pickEmail(m, args)
    if (!email) return notifReply(`Buat email dulu: ${pfxOf(prefix)}tempmail`, TITLE)
    const lock = `tm:wait:${m.sender}`
    if (!acquireLock(lock)) return notifReply('Masih ada proses menunggu email yang berjalan.', TITLE)
    try {
        await react(conn, m, '⏳')
        await notifReply(`📬 Menunggu email masuk ke ${email} (maks 2 menit)...`, TITLE)
        const r = await tempmail.listenInboxWs(email, 120)
        if (r.status !== 'success') {
            await react(conn, m, '❌')
            return notifReply(r.error_code === 'TIMEOUT' ? '⌛ Tidak ada email masuk dalam 2 menit.' : `❌ ${r.message || 'Gagal menunggu email.'}`, TITLE)
        }
        const d = r.data
        await react(conn, m, '✅')
        await notifReply(box('EMAIL MASUK', [
            `Dari   : ${clip(d.from, 60)}`,
            `Subjek : ${clip(d.subject, 80)}`,
            `OTP    : ${d.otp || '(tidak terdeteksi)'}`,
            d.verification_link && `Link   : ${d.verification_link}`
        ]), TITLE)
    } finally { releaseLock(lock) }
})

export default tempmailNew
export const handlers = [tempmailInbox, tempmailRead, tempmailOtp]
