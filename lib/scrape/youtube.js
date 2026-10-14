/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import axios from 'axios'
import { hasYtdlp, runYtdlp } from '../ytdlp.js'

// ============================================================
// Definisi client YouTube (innertube). Setiap client punya
// User-Agent dan header X-YouTube-Client-* sendiri yang HARUS
// konsisten sama context.client di body — kalau ketuker (misal
// body bilang ANDROID tapi UA-nya browser Mozilla), YouTube
// nolak requestnya dengan 400.
// ============================================================
const CLIENTS = {
    WEB: {
        clientName: 'WEB',
        clientVersion: '2.20240701.00.00',
        clientIdHeader: '1',
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0'
        ]
    },
    // Client untuk ambil stream. Dicoba berurutan sampai satu memberi URL yang benar-benar bisa dibuka.
    // ANDROID_VR & TV-embed biasanya TIDAK butuh PO token, sedangkan ANDROID lama sekarang sering
    // ditolak (LOGIN_REQUIRED / 403) — itu sebabnya satu client saja tidak cukup.
    ANDROID_VR: {
        clientName: 'ANDROID_VR',
        clientVersion: '1.60.19',
        clientIdHeader: '28',
        androidSdkVersion: 32,
        deviceMake: 'Oculus',
        deviceModel: 'Quest 3',
        osName: 'Android',
        osVersion: '12L',
        userAgents: ['com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip']
    },
    TV_EMBED: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0',
        clientIdHeader: '85',
        thirdParty: { embedUrl: 'https://www.youtube.com/' },
        userAgents: ['Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15']
    },
    IOS: {
        clientName: 'IOS',
        clientVersion: '19.45.4',
        clientIdHeader: '5',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        osName: 'iPhone',
        osVersion: '18.1.0.22B83',
        userAgents: ['com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)']
    },
    ANDROID: {
        clientName: 'ANDROID',
        clientVersion: '19.44.38',
        clientIdHeader: '3',
        androidSdkVersion: 30,
        userAgents: ['com.google.android.youtube/19.44.38 (Linux; U; Android 11) gzip']
    }
}

const STREAM_CLIENTS = ['ANDROID_VR', 'TV_EMBED', 'IOS', 'ANDROID']

function randomUserAgent(client) {
    const list = client.userAgents
    return list[Math.floor(Math.random() * list.length)]
}

// ============================================================
// Rotasi proxy / IP (opsional).
// Isi lewat environment variable YT_PROXIES, dipisah koma, contoh:
//   YT_PROXIES="http://user:pass@1.2.3.4:8080,http://5.6.7.8:3128"
// Kalau kosong, request jalan pakai IP server langsung (gak ada proxy).
// Saya GAK hardcode IP proxy apapun di sini karena saya gak punya proxy
// beneran yang bisa saya jamin jalan — proxy palsu cuma bakal bikin request gagal.
// ============================================================
const PROXY_LIST = (process.env.YT_PROXIES || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)

function pickProxy() {
    if (!PROXY_LIST.length) return null
    return PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)]
}

function buildAxiosConfig(client, extraHeaders = {}) {
    const config = {
        headers: {
            'User-Agent': randomUserAgent(client),
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'X-YouTube-Client-Name': client.clientIdHeader,
            'X-YouTube-Client-Version': client.clientVersion,
            ...extraHeaders
        },
        timeout: 20000
    }

    const proxyUrl = pickProxy()
    if (proxyUrl) {
        try {
            const u = new URL(proxyUrl)
            config.proxy = {
                host: u.hostname,
                port: Number(u.port) || 80,
                protocol: u.protocol.replace(':', ''),
                auth: u.username
                    ? { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password || '') }
                    : undefined
            }
        } catch (e) {
            console.error('[youtube.js] Proxy URL tidak valid, dilewati:', proxyUrl)
        }
    }

    return config
}

// ============================================================
// Innertube (API internal yang dipakai website/app YouTube sendiri).
// Key ini PUBLIK — tertanam di source code youtube.com, bukan credential rahasia.
// ============================================================
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const SEARCH_URL = `https://www.youtube.com/youtubei/v1/search?key=${INNERTUBE_KEY}`
const PLAYER_URL = `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`

function extractVideoId(input = '') {
    const match = String(input).match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([a-zA-Z0-9_-]{11})/
    )
    return match ? match[1] : null
}

/**
 * Cari video YouTube berdasarkan judul/keyword, atau langsung terima link YouTube.
 * Return: URL watch (https://www.youtube.com/watch?v=xxxxxxxxxxx)
 */
export async function searchYoutube(query) {
    if (!query || !String(query).trim()) {
        throw new Error('Query pencarian kosong.')
    }

    const directId = extractVideoId(query)
    if (directId) return `https://www.youtube.com/watch?v=${directId}`

    const body = {
        context: {
            client: {
                clientName: CLIENTS.WEB.clientName,
                clientVersion: CLIENTS.WEB.clientVersion,
                hl: 'en',
                gl: 'US'
            }
        },
        query: String(query).trim()
    }

    let res
    try {
        res = await axios.post(SEARCH_URL, body, buildAxiosConfig(CLIENTS.WEB, { Origin: 'https://www.youtube.com' }))
    } catch (e) {
        // Cadangan: paket yt-search (sudah ada di dependency) kalau endpoint innertube menolak.
        const alt = await searchViaYtSearch(query).catch(() => null)
        if (alt) return alt
        const detail = e.response?.data ? ` | ${JSON.stringify(e.response.data).slice(0, 300)}` : ''
        throw new Error(`Gagal menghubungi YouTube (search): ${e.response?.status ? e.response.status + ' - ' : ''}${e.message}${detail}`)
    }

    const sections =
        res.data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
            ?.sectionListRenderer?.contents || []

    let videoId = null
    for (const section of sections) {
        const items = section?.itemSectionRenderer?.contents || []
        for (const item of items) {
            if (item?.videoRenderer?.videoId) {
                videoId = item.videoRenderer.videoId
                break
            }
        }
        if (videoId) break
    }

    if (!videoId) {
        const alt = await searchViaYtSearch(query).catch(() => null)
        if (alt) return alt
        throw new Error(`Video "${query}" tidak ditemukan di YouTube.`)
    }

    return `https://www.youtube.com/watch?v=${videoId}`
}

async function searchViaYtSearch(query) {
    const yts = (await import('yt-search')).default
    const r = await yts(String(query).trim())
    const vid = r?.videos?.[0]
    return vid?.videoId ? `https://www.youtube.com/watch?v=${vid.videoId}` : null
}

function clientContext(client) {
    const c = {
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        hl: 'en',
        gl: 'US'
    }
    if (client.androidSdkVersion) c.androidSdkVersion = client.androidSdkVersion
    if (client.deviceMake) c.deviceMake = client.deviceMake
    if (client.deviceModel) c.deviceModel = client.deviceModel
    if (client.osName) c.osName = client.osName
    if (client.osVersion) c.osVersion = client.osVersion
    if (client.clientName !== 'TVHTML5_SIMPLY_EMBEDDED_PLAYER') c.userAgent = client.userAgents[0]
    return c
}

// Cek cepat apakah URL stream benar-benar bisa dibuka (googlevideo sering membalas 403 tanpa PO token).
async function probeStream(url, ua) {
    try {
        const res = await axios.get(url, {
            timeout: 12000,
            responseType: 'stream',
            headers: { 'User-Agent': ua, Range: 'bytes=0-1' },
            validateStatus: () => true
        })
        res.data?.destroy?.()
        return res.status === 200 || res.status === 206
    } catch {
        return false
    }
}

async function fetchPlayer(videoId, clientKey) {
    const client = CLIENTS[clientKey]
    const body = {
        context: { client: clientContext(client), ...(client.thirdParty ? { thirdParty: client.thirdParty } : {}) },
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
        playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } }
    }
    const res = await axios.post(PLAYER_URL, body, buildAxiosConfig(client))
    return { data: res.data, client }
}

const mimeOf = f => String(f.mimeType || '')

/**
 * Cari satu stream yang benar-benar bisa dipakai. mode: 'video' | 'audio'.
 * Mencoba beberapa client YouTube berurutan; tiap kandidat URL dites dulu (probe) sebelum dipakai.
 */
async function resolveStream(youtubeUrl, mode, quality = '360') {
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) throw new Error('URL YouTube tidak valid.')

    const errors = []
    for (const key of STREAM_CLIENTS) {
        try {
            const { data, client } = await fetchPlayer(videoId, key)
            const status = data?.playabilityStatus?.status
            if (status && status !== 'OK') {
                errors.push(`${key}: ${status}${data?.playabilityStatus?.reason ? ' (' + String(data.playabilityStatus.reason).slice(0, 80) + ')' : ''}`)
                continue
            }

            const streaming = data?.streamingData || {}
            const progressive = (streaming.formats || []).filter(f => f.url)
            const adaptive = (streaming.adaptiveFormats || []).filter(f => f.url)

            let candidates = []
            if (mode === 'audio') {
                candidates = adaptive
                    .filter(f => mimeOf(f).startsWith('audio/'))
                    .sort((a, b) => {
                        // Utamakan m4a/mp4 (kompatibel luas), lalu bitrate tertinggi
                        const am = mimeOf(a).includes('mp4') ? 1 : 0
                        const bm = mimeOf(b).includes('mp4') ? 1 : 0
                        return bm - am || (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0)
                    })
            } else {
                const target = Number(quality) || 360
                const byHeight = (a, b) => Math.abs((a.height || 0) - target) - Math.abs((b.height || 0) - target)
                // Format progresif (video + audio jadi satu) diutamakan: format adaptive video-only TIDAK ada suaranya.
                const prog = progressive.filter(f => mimeOf(f).includes('video/mp4')).sort(byHeight)
                const adapt = adaptive.filter(f => mimeOf(f).includes('video/mp4')).sort(byHeight).map(f => ({ ...f, _silent: true }))
                candidates = [...prog, ...adapt]
            }

            if (!candidates.length) {
                errors.push(`${key}: tidak ada format ${mode === 'audio' ? 'audio' : 'mp4'} dengan URL langsung`)
                continue
            }

            const ua = client.userAgents[0]
            let picked = null
            for (const f of candidates.slice(0, 3)) {
                if (await probeStream(f.url, ua)) { picked = f; break }
            }
            if (!picked) {
                errors.push(`${key}: URL stream ditolak (403, butuh PO token)`)
                continue
            }

            const details = data?.videoDetails || {}
            const thumbs = details.thumbnail?.thumbnails || []
            return {
                url: picked.url,
                title: details.title || 'YouTube Video',
                author: details.author || 'YouTube',
                duration: Number(details.lengthSeconds) || 0,
                thumb: thumbs.length ? thumbs[thumbs.length - 1].url : null,
                mime: mimeOf(picked).split(';')[0],
                hasAudio: mode === 'audio' ? true : !picked._silent,
                headers: { 'User-Agent': ua },
                client: key
            }
        } catch (e) {
            const detail = e.response?.status ? `HTTP ${e.response.status}` : (e.code || e.message)
            errors.push(`${key}: ${detail}`)
        }
    }

    // Cadangan terakhir: yt-dlp kalau terpasang
    if (await hasYtdlp()) {
        try {
            const fmt = mode === 'audio' ? 'bestaudio[ext=m4a]/bestaudio' : `best[height<=${Number(quality) || 360}][ext=mp4]/best[ext=mp4]/best`
            const out = await runYtdlp(['-g', '-f', fmt, '--no-warnings', '--no-playlist', `https://www.youtube.com/watch?v=${videoId}`], { timeout: 60000 })
            const url = out.split('\n').map(x => x.trim()).find(x => /^https?:\/\//.test(x))
            if (url) {
                return { url, title: 'YouTube Video', author: 'YouTube', duration: 0, thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, mime: '', hasAudio: true, headers: {}, client: 'yt-dlp' }
            }
        } catch (e) {
            errors.push(`yt-dlp: ${e.message}`)
        }
    }

    throw new Error(`Semua metode YouTube gagal → ${errors.join(' ; ')}`)
}

/**
 * Ambil direct stream URL + metadata dari sebuah link YouTube (video, ada suaranya).
 */
export async function getYoutubeDirectUrl(youtubeUrl, quality = '360') {
    return resolveStream(youtubeUrl, 'video', quality)
}

/**
 * Ambil direct URL audio saja (dipakai .play sebagai cadangan kalau Savetube gagal).
 */
export async function getYoutubeAudioUrl(youtubeUrl) {
    return resolveStream(youtubeUrl, 'audio')
}

/**
 * Wrapper kompatibel dengan plugins/downloader/youtube.js (fallback "Nevercap").
 * Return: { success, url, title, author, duration, thumb, error }
 * Tidak pernah throw, supaya plugin bisa lanjut ke penanganan error sendiri.
 */
export async function ytmp4(youtubeUrl, quality = '360') {
    try {
        const r = await getYoutubeDirectUrl(youtubeUrl, quality)
        if (!r?.url) return { success: false, error: 'URL video tidak ditemukan' }
        return {
            success: true,
            url: r.url,
            title: r.title,
            author: r.author,
            duration: r.duration,
            thumb: r.thumb,
            mime: r.mime,
            headers: r.headers || {}
        }
    } catch (e) {
        return { success: false, error: e?.message || String(e) }
    }
}

/** Alias audio, untuk jaga-jaga kalau ada plugin lain yang memanggil ytmp3. */
export async function ytmp3(youtubeUrl) {
    try {
        const r = await getYoutubeAudioUrl(youtubeUrl)
        if (!r?.url) return { success: false, error: 'URL audio tidak ditemukan' }
        return { success: true, url: r.url, title: r.title, author: r.author, duration: r.duration, thumb: r.thumb, mime: r.mime, headers: r.headers || {} }
    } catch (e) {
        return { success: false, error: e?.message || String(e) }
    }
}
