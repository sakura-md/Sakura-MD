/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import axios from 'axios'
import { getStore } from './cache.js'
import { hasYtdlp, runYtdlp } from './ytdlp.js'
import { proxyCount } from './proxy.js'
import { proxyRequest } from './netjson.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const TIKWM = 'https://www.tikwm.com'
const cache = getStore('tiktok-feed', 20 * 1000, 200)

const clean = (v = '') => String(v ?? '').trim()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const VIDEO_ID = /^\d{8,25}$/

// ------------------------------------------------------------------
// Normalisasi
// ------------------------------------------------------------------
function absUrl(u = '') {
    const s = clean(u)
    if (!s) return ''
    if (s.startsWith('//')) return `https:${s}`
    if (s.startsWith('/')) return `${TIKWM}${s}`
    return s
}

function coverCandidatesFromVideo(v = {}) {
    const video = v.video || v.videoInfo || v.video_info || {}
    const values = [
        video.cover,
        video.coverUrl,
        video.dynamicCover,
        video.originCover,
        video.origin_cover,
        video.thumbnail,
        v.cover,
        v.origin_cover,
        v.originCover,
        v.ai_dynamic_cover,
        v.dynamic_cover,
        v.coverUrl,
        v.thumbnail,
        v.thumbnail_url
    ]
    return [...new Set(values.map(absUrl).filter(Boolean))]
}

function coverFromVideo(v = {}) {
    return coverCandidatesFromVideo(v)[0] || ''
}

function statsFromVideo(v = {}) {
    const s = v.stats || v.statistics || v.statsV2 || v.stats_v2 || {}
    const num = (...values) => {
        for (const value of values) {
            if (value === undefined || value === null || value === '') continue
            const n = Number(value)
            if (Number.isFinite(n)) return n
        }
        return 0
    }
    return {
        views: num(s.playCount, s.play_count, v.play_count, v.playCount),
        likes: num(s.diggCount, s.digg_count, v.digg_count, v.diggCount),
        comments: num(s.commentCount, s.comment_count, v.comment_count, v.commentCount),
        shares: num(s.shareCount, s.share_count, v.share_count, v.shareCount)
    }
}

// Ambil id video dari SEMUA kandidat (bukan cuma yang pertama terisi), termasuk dari URL kalau perlu.
// Penyebab video API key terbuang: kandidat pertama terisi tapi bukan angka, sementara id yang benar ada di field lain.
export function pickVideoId(v = {}) {
    const cands = [v.aweme_id, v.awemeId, v.video_id, v.videoId, v.itemId, v.item_id, v.id, v.group_id]
    for (const c of cands) {
        const id = clean(typeof c === 'number' ? BigInt(Math.trunc(c)).toString() : c)
        if (VIDEO_ID.test(id)) return id
    }
    for (const f of [v.share_url, v.shareUrl, v.url, v.link, v.play, v.wmplay]) {
        const m = clean(f).match(/\/(?:video|photo)\/(\d{8,25})/)
        if (m) return m[1]
    }
    return ''
}

// ID video TikTok = snowflake: 32 bit teratas adalah waktu upload (detik, UTC).
// Dipakai kalau sumber hanya memberi ID/link video tanpa waktu, supaya urutan & deteksi video baru tetap benar.
export function timeFromVideoId(id = '') {
    try {
        const sec = Number(BigInt(String(id)) >> 32n)
        const now = Math.floor(Date.now() / 1000)
        return sec > 1451606400 && sec <= now + 86400 ? sec : 0   // 2016-01-01 .. besok
    } catch {
        return 0
    }
}

export function normalizeVideo(v = {}, username = '') {
    const authorRaw = v.author ?? v.authorInfo ?? v.author_info
    const author = authorRaw && typeof authorRaw === 'object' ? authorRaw : {}
    const owner = clean(
        author.uniqueId ||
        author.unique_id ||
        author.username ||
        (typeof authorRaw === 'string' ? authorRaw : '') ||
        v.authorUniqueId ||
        v.uniqueId
    ).replace(/^@/, '')

    const id = pickVideoId(v)
    if (!id) return null

    let createTime = Number(v.createTime ?? v.create_time ?? v.createTimeSec ?? 0)
    if (createTime > 1e12) createTime = Math.floor(createTime / 1000)
    if (!createTime) createTime = timeFromVideoId(id)

    const uid = owner || username
    return {
        id,
        username: uid,
        desc: clean(
            v.desc ??
            v.description ??
            v.content_desc ??
            v.title ??
            v.video?.title ??
            v.videoInfo?.title ??
            v.video_info?.title
        ),
        createTime,
        cover: coverFromVideo(v),
        covers: coverCandidatesFromVideo(v),
        stats: statsFromVideo(v),
        link: `https://www.tiktok.com/@${uid}/video/${id}`,
        _owner: owner
    }
}

// strict=true (halaman web): buang video milik akun lain (rekomendasi / duet).
// strict=false (API per-username): hasil sudah pasti milik akun itu, jangan terbuang
// hanya karena nama author di respon berbeda format.
function finalize(rawVideos, username, strict = true) {
    const want = username.toLowerCase()
    const seen = new Set()
    const all = []
    for (const v of rawVideos) {
        if (!v || seen.has(v.id)) continue
        seen.add(v.id)
        all.push(v)
    }
    let out = all
    if (strict) out = all.filter(v => !v._owner || v._owner.toLowerCase() === want)
    else {
        const mine = all.filter(v => !v._owner || v._owner.toLowerCase() === want)
        if (mine.length) out = mine
    }
    for (const v of out) delete v._owner
    out.sort((a, b) => (b.createTime || 0) - (a.createTime || 0))
    return out.slice(0, 10)
}

// ------------------------------------------------------------------
// Sumber 1: tikwm (gratis, dibatasi 1 request/detik)
// Dicoba berurutan: POST form (cara yang dipakai situsnya sendiri) -> GET -> domain tanpa "www".
// Respon bukan JSON (halaman Cloudflare / HTML error) dibaca sebagai kegagalan yang jelas,
// bukan lagi "code=- HTTP -" yang tidak memberi petunjuk.
// ------------------------------------------------------------------
let tikwmNext = 0
async function tikwmSlot() {
    const at = Math.max(Date.now(), tikwmNext)
    tikwmNext = at + 1100
    const wait = at - Date.now()
    if (wait > 0) await sleep(wait)
}

const TIKWM_HEADERS = {
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'User-Agent': UA,
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    Origin: TIKWM,
    Referer: `${TIKWM}/`
}

// Respon SELALU dipaksa JSON. Kalau yang datang HTML (Cloudflare / error), proxy berikutnya
// dari proxies.txt dipakai otomatis sampai dapat JSON valid.
export async function tikwmCall(path, fields = {}) {
    const attempts = [
        { host: TIKWM, method: 'post', tries: 5 },
        { host: 'https://tikwm.com', method: 'get', tries: 3 }
    ]
    let last = 'tidak ada respon'

    for (const a of attempts) {
        // Tanpa proxy, tikwm membatasi 1 request/detik per IP. Dengan proxy tiap request IP-nya beda.
        if (!proxyCount()) await tikwmSlot()

        try {
            const { data: body } = await proxyRequest({
                url: `${a.host}${path}`,
                method: a.method,
                ...(a.method === 'post' ? { form: fields } : { params: fields }),
                headers: TIKWM_HEADERS,
                expect: 'json',
                tries: a.tries,
                accept: (b) => {
                    if (b?.code === 0) return true
                    const msg = clean(b?.msg)
                    // Akun memang tidak ada / privat -> ganti proxy tidak akan membantu.
                    if (/not exist|not found|private|no such|doesn.t exist|unique_id/i.test(msg)) {
                        throw Object.assign(new Error(`tikwm: ${msg}`), { fatal: true, code: 'NOT_FOUND' })
                    }
                    return false
                }
            })
            return body
        } catch (e) {
            if (e?.code === 'NOT_FOUND') throw e
            last = e?.message || String(e)
        }
    }
    throw new Error(`tikwm: ${last}`)
}

async function fromTikwm(username) {
    const body = await tikwmCall('/api/user/posts', { unique_id: username, count: 12, cursor: 0, web: 1, hd: 1 })
    const list = body?.data?.videos || body?.data?.items || body?.data?.list || body?.data?.itemList || []
    const videos = finalize(list.map(item => normalizeVideo(item, username)), username, false)
    if (!videos.length) throw new Error('tikwm tidak mengembalikan video (akun privat / belum ada postingan / respon kosong)')
    return videos
}

// ------------------------------------------------------------------
// Sumber 2: halaman profil TikTok (hanya berhasil kalau daftar video ikut dirender di HTML)
// ------------------------------------------------------------------
function parseJsonScripts(html = '') {
    const out = []
    const patterns = [
        /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i,
        /<script[^>]+id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i
    ]
    for (const re of patterns) {
        const m = html.match(re)
        if (!m) continue
        try { out.push(JSON.parse(m[1])) } catch {}
    }
    return out
}

// Objek video asli punya badan `video` atau `stats`. Objek profil (uniqueId + createTime akun)
// TIDAK boleh dianggap video.
function looksLikeVideo(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false
    const hasBody = !!(o.video || o.videoInfo || o.video_info)
    if (o.uniqueId && !hasBody) return false
    if (!pickVideoId(o)) return false
    return hasBody || !!(o.stats || o.statsV2 || o.statistics)
}

function collectVideoObjects(root, out = [], seen = new Set(), depth = 0) {
    if (!root || typeof root !== 'object' || depth > 18 || out.length >= 40) return out
    if (seen.has(root)) return out
    seen.add(root)

    if (Array.isArray(root)) {
        for (const item of root) collectVideoObjects(item, out, seen, depth + 1)
        return out
    }
    if (looksLikeVideo(root)) out.push(root)
    for (const value of Object.values(root)) {
        if (value && typeof value === 'object') collectVideoObjects(value, out, seen, depth + 1)
    }
    return out
}

export function extractVideosFromHtml(html = '', username = '') {
    const raw = []
    for (const root of parseJsonScripts(html)) {
        const detail = root?.__DEFAULT_SCOPE__?.['webapp.user-detail']
        if (Array.isArray(detail?.itemList)) raw.push(...detail.itemList)
        if (root?.ItemModule && typeof root.ItemModule === 'object') raw.push(...Object.values(root.ItemModule))
        collectVideoObjects(root, raw)
    }
    return finalize(raw.filter(looksLikeVideo).map(item => normalizeVideo(item, username)), username)
}

// Ambil ID video dari link `/@username/video/<id>` yang ada di HTML (termasuk yang di-escape di dalam JSON).
// Hanya link milik akun yang dipantau yang diambil, jadi video rekomendasi akun lain tidak ikut.
export function extractIdsFromHtml(html = '', username = '') {
    const text = String(html)
        .replace(/\\u002F/gi, '/')
        .replace(/\\\//g, '/')
    const want = username.toLowerCase()
    const re = /@([A-Za-z0-9._]{2,24})\/(?:video|photo)\/(\d{8,25})/g
    const ids = new Set()
    for (let m; (m = re.exec(text));) {
        if (m[1].toLowerCase() === want) ids.add(m[2])
    }
    const list = [...ids].map(id => normalizeVideo({ id, author: { uniqueId: username } }, username))
    return finalize(list, username, false)
}

const HTML_HEADERS = {
    'User-Agent': UA,
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Referer: 'https://www.tiktok.com/'
}

async function fetchHtml(url) {
    const { data, status } = await proxyRequest({
        url,
        headers: HTML_HEADERS,
        expect: 'html',
        tries: 4,
        timeout: 20000,
        accept: (html, st) => st < 400 && html.length > 2000
    })
    return { html: data, status }
}

async function fromTikTok(username) {
    const { html, status } = await fetchHtml(`https://www.tiktok.com/@${encodeURIComponent(username)}?lang=en`)

    const videos = extractVideosFromHtml(html, username)
    if (videos.length) return videos

    const byLink = extractIdsFromHtml(html, username)
    if (byLink.length) return byLink
    throw new Error(`Daftar video tidak ada di halaman publik TikTok (HTTP ${status})`)
}

// ------------------------------------------------------------------
// Sumber 2b: halaman embed kreator TikTok (tanpa login, tanpa API key)
// ------------------------------------------------------------------
async function fromTikTokEmbed(username) {
    const { html, status } = await fetchHtml(`https://www.tiktok.com/embed/@${encodeURIComponent(username)}`)

    const videos = extractVideosFromHtml(html, username)
    if (videos.length) return videos

    const byLink = extractIdsFromHtml(html, username)
    if (byLink.length) return byLink
    throw new Error(`Halaman embed TikTok tidak memuat daftar video (HTTP ${status})`)
}

// ------------------------------------------------------------------
// Sumber 3: yt-dlp (opsional — hanya jalan kalau yt-dlp terpasang di server)
// ------------------------------------------------------------------
async function fromYtdlp(username) {
    if (!(await hasYtdlp())) throw new Error('yt-dlp tidak terpasang (opsional, dilewati)')
    const out = await runYtdlp([
        '--flat-playlist', '-J', '--playlist-end', '10', '--no-warnings', '--socket-timeout', '15',
        `https://www.tiktok.com/@${username}`
    ], { timeout: 70000 })

    let json
    try { json = JSON.parse(out) } catch { throw new Error('yt-dlp: output bukan JSON') }
    const entries = Array.isArray(json?.entries) ? json.entries : []
    const list = entries.map(e => normalizeVideo({
        id: e.id,
        desc: e.title || e.description,
        create_time: e.timestamp || 0,
        cover: e.thumbnail || e.thumbnails?.[e.thumbnails.length - 1]?.url || '',
        author: { uniqueId: username }
    }, username))
    const videos = finalize(list, username, false)
    if (!videos.length) throw new Error('yt-dlp tidak mengembalikan video')
    return videos
}

// 100% scraper: tanpa API key berbayar / berkuota.
const PROVIDERS = [
    { name: 'tikwm', run: fromTikwm },
    { name: 'tiktok-web', run: fromTikTok },
    { name: 'tiktok-embed', run: fromTikTokEmbed },
    { name: 'yt-dlp', run: fromYtdlp }
]

// Provider yang gagal berturut-turut "diistirahatkan" sebentar supaya setiap pengecekan tidak
// buang waktu di sumber yang jelas mati (mis. halaman web TikTok). Kalau semuanya sedang istirahat,
// semua tetap dicoba.
const health = new Map() // name -> { fails, until, lastError, lastOkAt }
const FAILS_BEFORE_REST = 3
const REST_MS = 10 * 60 * 1000

function markFail(name, message) {
    const h = health.get(name) || { fails: 0, until: 0 }
    h.fails += 1
    h.lastError = message
    if (h.fails >= FAILS_BEFORE_REST) h.until = Date.now() + REST_MS
    health.set(name, h)
}

function markOk(name) {
    health.set(name, { fails: 0, until: 0, lastOkAt: Date.now() })
}

export const feedHealth = () => Object.fromEntries(
    PROVIDERS.map(p => [p.name, { ...(health.get(p.name) || {}), enabled: p.enabled ? !!p.enabled() : true }])
)

// Mengembalikan { source, videos } — videos urut dari yang terbaru.
export async function fetchTikTokFeed(username, { fresh = false } = {}) {
    const name = clean(username).replace(/^@/, '')
    if (!/^[A-Za-z0-9._]{2,24}$/.test(name)) throw new Error('Username TikTok tidak valid')

    const key = name.toLowerCase()
    if (!fresh) {
        const hit = cache.get(key)
        if (hit) return hit
    }

    const usable = PROVIDERS.filter(p => !p.enabled || p.enabled())
    const awake = fresh ? usable : usable.filter(p => !(health.get(p.name)?.until > Date.now()))
    const queue = awake.length ? awake : usable

    const errors = []
    for (const p of queue) {
        try {
            const videos = await p.run(name)
            markOk(p.name)
            const result = { source: p.name, videos }
            cache.set(key, result)
            return result
        } catch (e) {
            const msg = e?.message || String(e)
            markFail(p.name, msg)
            const prefix = `${p.name}:`
            errors.push(`${p.name}: ${msg.startsWith(prefix) ? msg.slice(prefix.length).trim() : msg}`)
        }
    }
    throw new Error(errors.join(' | ') || 'Gagal mengambil feed TikTok')
}

export async function getTikTokFeed(username, opts) {
    return (await fetchTikTokFeed(username, opts)).videos
}

export async function getLatestTikTokVideo(username, opts) {
    const list = await getTikTokFeed(username, opts)
    return list[0] || null
}