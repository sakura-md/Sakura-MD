/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Pengambil data profil TikTok (dipakai plugins/stalker/verif.js & info.js).
// Tanpa API key. Semua request lewat proxies.txt (rotasi otomatis) dan respon dipaksa JSON:
// 1) tikwm (JSON)  2) API web TikTok (JSON)  3) halaman profil TikTok (JSON di dalam HTML).
import axios from 'axios'
import sharp from 'sharp'
import { getStore } from './cache.js'
import { tikwmCall } from './tiktokfeed.js'
import { getProxyConfig } from './proxy.js'
import { proxyRequest } from './netjson.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const cache = getStore('tiktok-profile', 2 * 60 * 1000, 100)

export class TikTokError extends Error {
    constructor(message, code = 'FAILED') { super(message); this.code = code }
}

// "@user", "user", atau link tiktok.com/@user -> "user" (null kalau tidak valid)
export function parseUsername(input = '') {
    let s = String(input).trim()
    const link = s.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i)
    if (link) s = link[1]
    s = s.replace(/^@/, '').split(/[\s?#/]/)[0]
    return /^[A-Za-z0-9._]{2,24}$/.test(s) ? s : null
}

// Ambil JSON profil dari HTML halaman TikTok
export function parseWebHtml(html = '') {
    const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!m) return null
    let json
    try { json = JSON.parse(m[1]) } catch { return null }
    const detail = json?.__DEFAULT_SCOPE__?.['webapp.user-detail']
    if (!detail) return null
    if (detail.statusCode && detail.statusCode !== 0) return { notFound: true }
    return detail.userInfo?.user ? detail.userInfo : null
}

const normalize = (user = {}, stats = {}) => ({
    id: user.id || '',
    username: user.uniqueId || '',
    nickname: user.nickname || '',
    bio: (user.signature || '').trim(),
    avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb || '',
    verified: !!user.verified,
    private: !!(user.privateAccount ?? user.secret),
    region: user.language || user.region || '',
    createTime: Number(user.createTime) || 0,
    nickModifyTime: Number(user.nickNameModifyTime) || 0,
    followers: Number(stats.followerCount) || 0,
    following: Number(stats.followingCount) || 0,
    likes: Number(stats.heartCount ?? stats.heart) || 0,
    videos: Number(stats.videoCount) || 0,
    friends: Number(stats.friendCount) || 0,
    seller: !!(user.ttSeller || user.commerceUserInfo?.commerceUser),
    link: `https://www.tiktok.com/@${user.uniqueId || ''}`
})

const WEB_HEADERS = {
    'User-Agent': UA,
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.tiktok.com/'
}

// Sumber 1: tikwm -> JSON
async function fromTikwm(username) {
    let body
    try {
        body = await tikwmCall('/api/user/info', { unique_id: username })
    } catch (e) {
        if (e?.code === 'NOT_FOUND') throw new TikTokError('Akun tidak ditemukan', 'NOT_FOUND')
        throw new TikTokError(e?.message || 'tikwm gagal')
    }
    if (!body?.data?.user) throw new TikTokError('tikwm tidak mengembalikan data akun')
    return normalize(body.data.user, body.data.stats)
}

// Sumber 2: endpoint JSON web TikTok
async function fromApi(username) {
    let data
    try {
        ;({ data } = await proxyRequest({
            url: 'https://www.tiktok.com/api/user/detail/',
            params: {
                uniqueId: username,
                aid: 1988,
                app_language: 'en',
                app_name: 'tiktok_web',
                device_platform: 'web_pc',
                browser_language: 'en-US',
                browser_name: 'Mozilla',
                browser_online: true,
                browser_platform: 'Win32',
                priority_region: '',
                region: 'US',
                screen_height: 1080,
                screen_width: 1920
            },
            headers: WEB_HEADERS,
            expect: 'json',
            tries: 4,
            accept: d => !!d?.userInfo?.user || (d?.statusCode && d.statusCode !== 0)
        }))
    } catch (e) {
        throw new TikTokError(e?.message || 'API web TikTok gagal')
    }
    if (!data?.userInfo?.user) throw new TikTokError('Akun tidak ditemukan', 'NOT_FOUND')
    return normalize(data.userInfo.user, data.userInfo.stats)
}

// Sumber 3: JSON yang tertanam di halaman profil
async function fromWeb(username) {
    let info
    try {
        await proxyRequest({
            url: `https://www.tiktok.com/@${encodeURIComponent(username)}?lang=en`,
            headers: { ...WEB_HEADERS, Accept: 'text/html,application/xhtml+xml' },
            expect: 'html',
            tries: 4,
            timeout: 20000,
            accept: (html, st) => {
                if (st >= 500) return false
                info = parseWebHtml(typeof html === 'string' ? html : '')
                return !!info
            }
        })
    } catch (e) {
        throw new TikTokError(e?.message || 'Halaman TikTok tidak bisa dibaca')
    }
    if (info?.notFound) throw new TikTokError('Akun tidak ditemukan', 'NOT_FOUND')
    return normalize(info.user, info.stats)
}

const SOURCES = [
    ['tikwm', fromTikwm],
    ['tiktok-api', fromApi],
    ['tiktok-web', fromWeb]
]

export async function getTikTokUser(username) {
    const key = username.toLowerCase()
    const hit = cache.get(key)
    if (hit) return hit

    const errors = []
    for (const [name, run] of SOURCES) {
        try {
            const result = await run(username)
            cache.set(key, result)
            return result
        } catch (e) {
            if (e.code === 'NOT_FOUND') throw e
            errors.push(`${name}: ${e?.message || e}`)
        }
    }
    console.error('[tiktokinfo] semua sumber gagal:', errors.join(' | '))
    throw new TikTokError('Gagal mengambil data TikTok')
}

// Foto profil -> thumbnail 300x300 (untuk header pesan tombol). Kosong kalau gagal.
export async function getAvatarThumb(url) {
    if (!url) return Buffer.alloc(0)
    try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': UA }, ...getProxyConfig() })
        return await sharp(Buffer.from(data)).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()
    } catch {
        return Buffer.alloc(0)
    }
}

// Foto profil -> gambar persegi 1:1 (720x720, dipotong tengah, tidak ditarik/gepeng). Kosong kalau gagal.
export async function getAvatarSquare(url, size = 720) {
    if (!url) return Buffer.alloc(0)
    try {
        const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': UA }, ...getProxyConfig() })
        return await sharp(Buffer.from(data)).rotate().resize(size, size, { fit: 'cover', position: 'centre' }).jpeg({ quality: 88 }).toBuffer()
    } catch {
        return Buffer.alloc(0)
    }
}

// 1250 -> "1,3K", 2500000 -> "2,5JT"
export function compact(n = 0) {
    const f = (v, s) => `${(Math.round(v * 10) / 10).toString().replace('.', ',')}${s}`
    if (n >= 1e9) return f(n / 1e9, 'M')
    if (n >= 1e6) return f(n / 1e6, 'JT')
    if (n >= 1e3) return f(n / 1e3, 'K')
    return String(n)
}
export const exact = (n = 0) => Number(n).toLocaleString('id-ID')

// Detik epoch -> "11 jam 25 menit yang lalu"
export function agoText(epochSec) {
    if (!epochSec) return '-'
    let s = Math.max(0, Math.floor(Date.now() / 1000 - epochSec))
    const units = [['tahun', 31536000], ['bulan', 2592000], ['hari', 86400], ['jam', 3600], ['menit', 60]]
    const parts = []
    for (const [name, size] of units) {
        const v = Math.floor(s / size)
        s -= v * size
        if (v > 0) parts.push(`${v} ${name}`)
    }
    return parts.length ? `${parts.slice(0, 2).join(' ')} yang lalu` : 'baru saja'
}

// Samakan font dekoratif (𝙁𝙪𝙨𝙝𝙞𝙜𝙪𝙧𝙤 -> fushiguro) supaya pencocokan nickname tidak tergantung font
export const normText = (s = '') =>
    String(s).normalize('NFKD').replace(/[\u0300-\u036f\u200b-\u200f\u2060\ufeff]/g, '').toLowerCase()