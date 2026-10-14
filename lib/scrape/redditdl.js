/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Reddit (video+suara, GIF, foto, galeri). Pakai JSON publik Reddit (tanpa login / API key).
// Sumber: www.reddit.com -> old.reddit.com -> (opsional) SakuraApis. Subreddit NSFW/privat dapat ditolak Reddit.
// Catatan: Reddit sering memblokir IP datacenter (HTTP 403/429); kalau begitu pesan error ditampilkan apa adanya.
import axios from 'axios'
import { DlError, httpGet, resolveUrl, hostMatches, buildResult, runProviders, viaSakura, decodeHtml, UA_DESKTOP } from './dlcommon.js'

// Endpoint API cadangan Reddit (opsional). Base URL & API key ada di config.js -> api (global).
const ENDPOINT = '/api/v1/downloader/save'
const fallbackApi = viaSakura('Reddit', ENDPOINT)


async function postJsonUrl(input, host) {
    let url = String(input).trim()
    if (hostMatches(url, ['redd.it']) && !/\/\/v\.redd\.it|i\.redd\.it|preview\.redd\.it/.test(url)) url = await resolveUrl(url)
    if (/\/s\/[A-Za-z0-9]+/.test(url)) url = await resolveUrl(url) // link share baru: /r/sub/s/xxxx
    const u = new URL(url)
    if (hostMatches(url, ['v.redd.it', 'i.redd.it'])) throw new DlError('Kirim link postingan Reddit (bukan link file langsung).', 'INVALID_URL')
    if (!/\/comments\/[a-z0-9]+/i.test(u.pathname)) throw new DlError('Link Reddit tidak valid (harus link postingan /comments/...).', 'INVALID_URL')
    const clean = u.pathname.replace(/\/+$/, '')
    return `https://${host}${clean}.json?raw_json=1`
}

async function probe(url) {
    try {
        const r = await axios.get(url, { timeout: 10000, responseType: 'stream', headers: { 'User-Agent': UA_DESKTOP, Range: 'bytes=0-1' }, validateStatus: () => true })
        r.data?.destroy?.()
        return r.status === 200 || r.status === 206
    } catch {
        return false
    }
}

// Reddit memisahkan video & audio. Nama file audio berbeda antar era -> coba semua kandidat.
async function findAudio(videoUrl) {
    const base = videoUrl.replace(/DASH_[^/?]+\.mp4.*$/i, '')
    for (const name of ['DASH_AUDIO_128.mp4', 'DASH_audio.mp4', 'DASH_AUDIO_64.mp4', 'audio.mp4', 'HLS_AUDIO_128_K.aac']) {
        const candidate = `${base}${name}`
        if (await probe(candidate)) return candidate
    }
    return ''
}

async function mediaFromPost(post, depth = 0) {
    if (post.crosspost_parent_list?.length && depth < 2) return mediaFromPost(post.crosspost_parent_list[0], depth + 1)
    const media = []

    const rv = post.secure_media?.reddit_video || post.media?.reddit_video || post.preview?.reddit_video_preview
    if (rv?.fallback_url) {
        const video = decodeHtml(rv.fallback_url).replace(/\?source=fallback$/, '')
        const audioUrl = rv.is_gif ? '' : await findAudio(video)
        media.push({ type: 'video', url: video, ...(audioUrl ? { audioUrl } : {}) })
    } else if (post.is_gallery && post.media_metadata) {
        const order = (post.gallery_data?.items || []).map(i => i.media_id)
        const ids = order.length ? order : Object.keys(post.media_metadata)
        for (const id of ids) {
            const meta = post.media_metadata[id]
            if (!meta || meta.status !== 'valid') continue
            const s = meta.s || {}
            if (s.mp4) media.push({ type: 'video', url: decodeHtml(s.mp4) })
            else if (s.gif) media.push({ type: 'image', url: decodeHtml(s.gif) })
            else if (s.u) media.push({ type: 'image', url: decodeHtml(s.u) })
        }
    } else {
        const variants = post.preview?.images?.[0]?.variants
        const direct = post.url_overridden_by_dest || post.url || ''
        if (variants?.mp4?.source?.url) media.push({ type: 'video', url: decodeHtml(variants.mp4.source.url) })
        else if (/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(direct) || hostMatches(direct, ['i.redd.it'])) media.push({ type: 'image', url: direct })
        else if (post.preview?.images?.[0]?.source?.url && post.post_hint === 'image') media.push({ type: 'image', url: decodeHtml(post.preview.images[0].source.url) })
    }
    return { media, post }
}

async function fromHost(url, host) {
    const jsonUrl = await postJsonUrl(url, host)
    const r = await httpGet(jsonUrl, { json: true, headers: { Accept: 'application/json' } })
    if (r.status === 403 || r.status === 429) throw new DlError(`${host}: HTTP ${r.status} (Reddit memblokir IP server ini)`, 'BLOCKED')
    if (r.status === 404) throw new DlError('postingan tidak ditemukan / sudah dihapus', 'NOT_FOUND')
    const post = r.data?.[0]?.data?.children?.[0]?.data
    if (r.status !== 200 || !post) throw new DlError(`${host}: HTTP ${r.status}`)
    const { media, post: src } = await mediaFromPost(post)
    if (!media.length) throw new DlError('postingan ini tidak berisi media Reddit (mungkin teks / link eksternal)', 'NO_MEDIA')
    return buildResult({
        platform: 'Reddit', source: host,
        title: post.title, author: `u/${post.author}${src.subreddit_name_prefixed ? ` • ${src.subreddit_name_prefixed}` : ''}`,
        thumbnail: '', media
    })
}

const viaWww = url => fromHost(url, 'www.reddit.com')
const viaOld = url => fromHost(url, 'old.reddit.com')

export const REDDIT_DOMAINS = ['reddit.com', 'redd.it']

export const getRedditMedia = url => runProviders('Reddit', [viaWww, viaOld, fallbackApi], url)
