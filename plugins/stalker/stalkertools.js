/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { parsePhoneNumber } from 'awesome-phonenumber'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, num, box, getTarget, durationText } from '../../lib/format.js'
import { getUser } from '../../lib/users.js'
import { inspectUrl } from '../../lib/urlcheck.js'

// STALKER MENU = OSINT/analitik terbatas: hanya data yang memang tersedia publik untuk bot
// (profil WhatsApp yang terlihat, format nomor, grup tempat bot menjadi member, statistik pemakaian bot).
// TIDAK ada pelacakan lokasi, baca chat pribadi, OTP/password, atau pemantauan diam-diam.
const T = { tags: ['stalker'] }
const usage = (prefix, s) => `Contoh:\n${pfxOf(prefix)}${s}`

async function publicProfile(conn, jid) {
    const [reg] = await conn.onWhatsApp(jid).catch(() => [])
    const statusRaw = await conn.fetchStatus(jid).catch(() => null)
    const st = Array.isArray(statusRaw) ? statusRaw[0]?.status : statusRaw
    const pp = await conn.profilePictureUrl(jid, 'image').catch(() => null)
    const biz = await conn.getBusinessProfile(jid).catch(() => null)
    return { exists: !!reg?.exists, bio: st?.status || null, bioAt: st?.setAt || null, pp, biz }
}

const list = [
    cmd({ command: ['profilecheck', 'profilwa'], desc: 'Profil WhatsApp yang terlihat bot', ...T, title: 'Profile Check' }, async (m, { conn, args, notifReply }) => {
        const target = getTarget(m, args) || m.sender
        const p = await publicProfile(conn, target)
        if (!p.exists) return notifReply('Nomor tidak terdaftar di WhatsApp.', 'Profile Check')
        await notifReply(box('PROFILE CHECK', [`Nomor  : ${num(target)}`, `Bio    : ${p.bio || '(kosong / disembunyikan)'}`, `Foto   : ${p.pp ? 'terlihat' : 'tidak terlihat / privat'}`, `Bisnis : ${p.biz ? 'akun bisnis' : 'bukan / tidak diketahui'}`, '', 'Hanya data yang WhatsApp izinkan untuk dilihat bot.']), 'Profile Check')
    }),

    cmd({ command: ['numbercheck', 'nomorcheck'], desc: 'Validasi format nomor', ...T, title: 'Number Check' }, async (m, { text, prefix, notifReply }) => {
        const raw = text.trim() || ''
        if (!raw) return notifReply(usage(prefix, 'numbercheck +6281234567890'), 'Number Check')
        const p = parsePhoneNumber(raw.startsWith('+') ? raw : `+${raw.replace(/[^0-9]/g, '')}`)
        if (!p.valid) return notifReply('❌ Format nomor tidak valid (sertakan kode negara).', 'Number Check')
        await notifReply(box('NUMBER CHECK', [`Format  : valid`, `Intl    : ${p.number.international}`, `Negara  : ${p.regionCode}`, `Seluler : ${p.typeIsMobile ? 'ya' : 'tidak'}`]), 'Number Check')
    }),

    cmd({ command: ['groupcheck'], desc: 'Info grup yang bot menjadi membernya', ...T, title: 'Group Check' }, async (m, { conn, args, prefix, notifReply }) => {
        const id = /@g\.us$/.test(args[0] || '') ? args[0] : m.isGroup ? m.chat : null
        if (!id) return notifReply(`Pakai di dalam grup, atau sertakan ID grup.\n${usage(prefix, 'groupcheck 1203630xxxx@g.us')}`, 'Group Check')
        const meta = await conn.groupMetadata(id).catch(() => null)
        if (!meta) return notifReply('Bot bukan member grup itu / grup tidak ditemukan.', 'Group Check')
        const admins = meta.participants.filter(p => p.admin).length
        await notifReply(box('GROUP CHECK', [`Nama    : ${meta.subject}`, `Member  : ${meta.participants.length}`, `Admin   : ${admins}`, `Dibuat  : ${meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : '-'}`, `Mode    : ${meta.announce ? 'hanya admin kirim pesan' : 'semua bisa kirim'}`]), 'Group Check')
    }),

    cmd({ command: ['usernamecheck'], desc: 'Cek username (butuh API)', ...T, title: 'Username Check' }, async (m, { text, prefix, notifReply }) => {
        if (!text.trim()) return notifReply(usage(prefix, 'usernamecheck sakura'), 'Username Check')
        // Belum ada endpoint pengecekan username yang dikonfigurasi di project ini -> jangan mengarang hasil.
        await notifReply(box('USERNAME CHECK', ['❌ Fitur sementara tidak tersedia.', 'API pengecekan username belum dikonfigurasi.', '', 'Owner perlu menambahkan endpoint di config.js (api) lalu plugin ini.']), 'Username Check')
    }),

    cmd({ command: ['ppcheck'], desc: 'Cek/lihat foto profil yang bisa diakses', ...T, title: 'PP Check' }, async (m, { conn, args, notifReply }) => {
        const target = getTarget(m, args) || m.sender
        const url = await conn.profilePictureUrl(target, 'image').catch(() => null)
        if (!url) return notifReply('Foto profil tidak bisa diakses (kosong atau disembunyikan pemiliknya).', 'PP Check')
        await conn.sendMessage(m.chat, { image: { url }, caption: `🖼️ Foto profil @${num(target)} dapat diakses.`, mentions: [target] }, { quoted: m })
    }),

    cmd({ command: ['publicinfo'], desc: 'Ringkasan info publik akun', ...T, title: 'Public Info' }, async (m, { conn, args, notifReply }) => {
        const target = getTarget(m, args) || m.sender
        const p = await publicProfile(conn, target)
        if (!p.exists) return notifReply('Nomor tidak terdaftar di WhatsApp.', 'Public Info')
        const region = parsePhoneNumber(`+${num(target)}`)
        await notifReply(box('PUBLIC INFO', [`Nomor  : +${num(target)}`, `Negara : ${region.valid ? region.regionCode : '-'}`, `Bio    : ${p.bio || '-'}`, `Foto   : ${p.pp ? 'publik' : 'privat'}`, `Bisnis : ${p.biz?.description ? p.biz.description.slice(0, 80) : (p.biz ? 'ya' : 'tidak')}`]), 'Public Info')
    }),

    cmd({ command: ['linkcheck'], desc: 'Cek link: redirect, status, tanda mencurigakan', ...T, title: 'Link Check' }, async (m, { text, prefix, notifReply }) => {
        const url = (text.trim() || m.quoted?.text || '').trim().split(/\s+/)[0]
        if (!url) return notifReply(usage(prefix, 'linkcheck https://contoh.com'), 'Link Check')
        const r = await inspectUrl(url)
        const chain = r.hops.map((h, i) => `${i + 1}. [${h.status}] ${h.url.slice(0, 70)}`)
        await notifReply(box('LINK CHECK', [`Host   : ${r.host}`, `Status : ${r.final ? r.final.status : 'tidak selesai'}`, '', ...chain, '', r.notes.length ? '⚠️ Catatan:' : '✅ Tidak ada tanda mencurigakan yang terdeteksi.', ...r.notes.map(n => `• ${n}`), '', 'Ini pemeriksaan heuristik — bukan jaminan link aman.']), 'Link Check')
    }),

    // ---- Analitik akun sendiri
    cmd({ command: ['myactivity'], desc: 'Aktivitas kamu terhadap bot', ...T, title: 'My Activity' }, async (m, { notifReply }) => {
        const u = getUser(m.sender)
        if (!u) return notifReply('Belum ada aktivitas tercatat.', 'My Activity')
        await notifReply(box('MY ACTIVITY', [`Pertama : ${new Date(u.firstSeen).toLocaleDateString('id-ID')}`, `Terakhir: ${durationText(Date.now() - u.lastSeen)} lalu`, `Total   : ${u.total} command`]), 'My Activity')
    }),
    cmd({ command: ['mystats'], desc: 'Jumlah command yang kamu pakai', ...T, title: 'My Stats' }, async (m, { notifReply }) => {
        const u = getUser(m.sender)
        if (!u) return notifReply('Belum ada statistik.', 'My Stats')
        const top = Object.entries(u.commands).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, n], i) => `${i + 1}. ${c} — ${n}x`)
        await notifReply(box('MY STATS', [`Total command: ${u.total}`, `Command unik  : ${Object.keys(u.commands).length}`, '', 'Terbanyak:', ...top]), 'My Stats')
    }),
    cmd({ command: ['myprofile'], desc: 'Data profil kamu yang diketahui bot', ...T, title: 'My Profile' }, async (m, { notifReply }) => {
        const u = getUser(m.sender)
        await notifReply(box('MY PROFILE', [`Nama   : ${m.pushName || u?.name || '-'}`, `Nomor  : ${num(m.sender)}`, `Status : ${m.isCreator ? 'Creator' : m.isOwner ? 'Owner' : m.isPremium ? 'Premium' : 'User'}`, `Command: ${u?.total || 0}`, '', 'Bot hanya menyimpan nama tampilan & statistik command — bukan isi pesan.']), 'My Profile')
    })
]

export default list[0]
export const handlers = list.slice(1)