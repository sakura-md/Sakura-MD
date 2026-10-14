/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import config from '../../config.js'
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, num } from '../../lib/format.js'
import { findMedia } from '../../lib/media.js'
import { checkCooldown } from '../../lib/cooldown.js'

// API key Tenor (Emoji Mix) — isi di sini
const TENOR_KEY = ''   // ← isi API key Tenor kamu

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storeDir = path.join(__dirname, '../../database/stickers')
const MAX_PER_USER = 30
const T = { tags: ['sticker'] }
const SAFE_NAME = /^[a-z0-9_-]{1,20}$/i

// wa-sticker-formatter dimuat saat dipakai supaya plugin tetap termuat walau paket belum terpasang
async function makeSticker(buffer, { pack, author, type = 'full', quality = 60 }) {
    let mod
    try { mod = await import('wa-sticker-formatter') } catch { throw new Error('Paket wa-sticker-formatter belum terpasang. Jalankan: npm install') }
    const { Sticker, StickerTypes } = mod
    const s = new Sticker(buffer, { pack, author, type: type === 'crop' ? StickerTypes.CROPPED : StickerTypes.FULL, quality })
    return s.toBuffer()
}

const stickerCfg = () => ({ pack: config.sticker?.packname || config.botName, author: config.sticker?.author || config.ownerName })

const sendSticker = (conn, m, out) => conn.sendMessage(m.chat, { sticker: out }, { quoted: m })

const stickerHandler = (names) => cmd({ command: names, desc: 'Buat sticker dari gambar/video (reply/caption)', ...T, title: 'Sticker' }, async (m, { conn, args, prefix, notifReply }) => {
    const media = findMedia(m, ['image', 'video'])
    if (!media) return notifReply(`Kirim/reply gambar atau video (maks 10 detik) dengan ${pfxOf(prefix)}${names[0]}`, 'Sticker')
    if (media.kind === 'video' && media.seconds > 10) return notifReply('Video terlalu panjang (maks 10 detik).', 'Sticker')
    if (media.size > 15 * 1048576) return notifReply('File terlalu besar (maks 15 MB).', 'Sticker')
    if (!m.isOwner) {
        const cd = checkCooldown(`sticker:${m.sender}`, 3)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik.`, 'Sticker')
    }
    const crop = String(args[0] || '').toLowerCase() === 'crop'
    const out = await makeSticker(await media.download(), { ...stickerCfg(), type: crop ? 'crop' : 'full' })
    await sendSticker(conn, m, out)
})

// Sticker -> gambar (statis). Sticker animasi butuh konversi video, dijelaskan ke user.
const toimg = cmd({ command: ['toimg', 'toimage'], desc: 'Ubah sticker jadi gambar', tags: ['sticker', 'tools'], title: 'ToImg' }, async (m, { conn, prefix, notifReply }) => {
    const media = findMedia(m, ['sticker'])
    if (!media) return notifReply(`Reply sticker dengan ${pfxOf(prefix)}toimg`, 'ToImg')
    if (media.animated) return notifReply('Sticker animasi tidak bisa dijadikan gambar diam. Gunakan .tovideo untuk mengubahnya jadi video.', 'ToImg')
    const png = await sharp(await media.download()).png().toBuffer()
    await conn.sendMessage(m.chat, { image: png, caption: '✅ Selesai' }, { quoted: m })
})

const take = cmd({ command: ['take', 'wm', 'swm'], desc: 'Ganti pack/author sticker: .take pack|author', ...T, title: 'Take' }, async (m, { conn, text, prefix, notifReply }) => {
    const media = findMedia(m, ['sticker'])
    if (!media) return notifReply(`Reply sticker dengan ${pfxOf(prefix)}take NamaPack|Author`, 'Take')
    const [pack, author] = text.split('|').map(s => s.trim())
    const def = stickerCfg()
    const out = await makeSticker(await media.download(), { pack: (pack || m.pushName || def.pack).slice(0, 40), author: (author ?? (pack ? '' : def.author)).slice(0, 40) })
    await sendSticker(conn, m, out)
})

// Emoji Mix butuh API key Tenor (tidak disertakan) -> jangan mengarang hasil
const emojimix = cmd({ command: ['emojimix'], desc: 'Gabung 2 emoji (butuh API Tenor)', ...T, title: 'Emoji Mix' }, async (m, { conn, text, notifReply }) => {
    const key = TENOR_KEY
    if (!key) return notifReply('❌ Fitur sementara tidak tersedia.\nAPI Emoji Mix (Tenor) belum dikonfigurasi.\nIsi variabel `TENOR_KEY` di plugins/sticker/stickertools.js.', 'Emoji Mix')
    const emojis = [...text.matchAll(/\p{Extended_Pictographic}/gu)].map(x => x[0])
    if (emojis.length < 2) return notifReply('Contoh: .emojimix 😀+😍', 'Emoji Mix')
    const axios = (await import('axios')).default
    const res = await axios.get('https://tenor.googleapis.com/v2/featured', { params: { key, contentfilter: 'high', media_filter: 'png_transparent', collection: 'emoji_kitchen_v5', q: `${emojis[0]}_${emojis[1]}` }, timeout: 15000 })
    const url = res.data?.results?.[0]?.url
    if (!url) return notifReply('Kombinasi emoji itu tidak tersedia.', 'Emoji Mix')
    const img = (await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })).data
    await sendSticker(conn, m, await makeSticker(Buffer.from(img), stickerCfg()))
})

// ---- Koleksi sticker pribadi (disimpan lokal, per user)
const userDir = (jid) => path.join(storeDir, num(jid))
const userList = (jid) => { try { return fs.readdirSync(userDir(jid)).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)) } catch { return [] } }

const stickeradd = cmd({ command: ['stickeradd', 'addsticker'], desc: 'Simpan sticker ke koleksimu: .stickeradd <nama>', ...T, title: 'Sticker Add' }, async (m, { text, prefix, notifReply }) => {
    const name = text.trim().toLowerCase()
    const media = findMedia(m, ['sticker'])
    if (!media || !SAFE_NAME.test(name)) return notifReply(`Reply sticker lalu ketik:\n${pfxOf(prefix)}stickeradd <nama>\n(nama: huruf/angka/_/-, maks 20)`, 'Sticker Add')
    const existing = userList(m.sender)
    if (!existing.includes(name) && existing.length >= MAX_PER_USER) return notifReply(`Koleksi penuh (maks ${MAX_PER_USER}). Hapus dulu dengan .stickerdel`, 'Sticker Add')
    if (media.size > 1048576) return notifReply('Sticker terlalu besar (maks 1 MB).', 'Sticker Add')
    fs.mkdirSync(userDir(m.sender), { recursive: true })
    fs.writeFileSync(path.join(userDir(m.sender), `${name}.webp`), await media.download())
    await notifReply(`✅ Sticker "${name}" disimpan (${userList(m.sender).length}/${MAX_PER_USER}).`, 'Sticker Add')
})
const stickerdel = cmd({ command: ['stickerdel', 'delsticker'], desc: 'Hapus sticker dari koleksi', ...T, title: 'Sticker Del' }, async (m, { text, prefix, notifReply }) => {
    const name = text.trim().toLowerCase()
    if (!SAFE_NAME.test(name)) return notifReply(`Contoh: ${pfxOf(prefix)}stickerdel nama`, 'Sticker Del')
    const file = path.join(userDir(m.sender), `${name}.webp`)
    if (!fs.existsSync(file)) return notifReply('Sticker itu tidak ada di koleksimu.', 'Sticker Del')
    fs.unlinkSync(file)
    await notifReply('✅ Dihapus.', 'Sticker Del')
})
const stickerpack = cmd({ command: ['stickerpack', 'mystickers'], desc: 'Daftar koleksi sticker-mu', ...T, title: 'Sticker Pack' }, async (m, { prefix, notifReply }) => {
    const l = userList(m.sender)
    await notifReply(l.length ? `📦 Koleksi (${l.length}/${MAX_PER_USER}):\n${l.map(n => `• ${n}`).join('\n')}\n\nKirim: ${pfxOf(prefix)}stickersearch <nama>` : `Koleksi kosong. Simpan dengan ${pfxOf(prefix)}stickeradd <nama> (reply sticker).`, 'Sticker Pack')
})
const stickersearch = cmd({ command: ['stickersearch', 'caristicker'], desc: 'Kirim sticker dari koleksimu (nama/sebagian nama)', ...T, title: 'Sticker Search' }, async (m, { conn, text, prefix, notifReply }) => {
    const q = text.trim().toLowerCase()
    if (!q) return notifReply(`Contoh: ${pfxOf(prefix)}stickersearch nama`, 'Sticker Search')
    const l = userList(m.sender)
    const hit = l.find(n => n === q) || l.find(n => n.includes(q))
    if (!hit) return notifReply('Tidak ada sticker dengan nama itu di koleksimu.', 'Sticker Search')
    await conn.sendMessage(m.chat, { sticker: fs.readFileSync(path.join(userDir(m.sender), `${hit}.webp`)) }, { quoted: m })
})

const list = [stickerHandler(['sticker', 's', 'stiker']), toimg, take, emojimix, stickeradd, stickerdel, stickerpack, stickersearch]
export default list[0]
export const handlers = list.slice(1)