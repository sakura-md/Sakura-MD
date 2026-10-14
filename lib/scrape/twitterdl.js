/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Twitter/X (video, GIF, foto). Sumber: api.fxtwitter.com -> api.vxtwitter.com .
import { DlError, httpGet, resolveUrl, hostMatches, buildResult, runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Twitter/X (sumber utama). Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/x'
const apiMain = viaSakura('Twitter/X', ENDPOINT)


const STATUS_RE = /(?:^|\/)(?:([A-Za-z0-9_]{1,15})\/)?status(?:es)?\/(\d{5,25})/

async function parseTweetUrl(input) {
    let url = String(input).trim()
    if (hostMatches(url, ['t.co'])) url = await resolveUrl(url)
    const m = new URL(url).pathname.match(STATUS_RE)
    if (!m) throw new DlError('Link tweet tidak valid (harus berisi /status/<id>).', 'INVALID_URL')
    return { user: m[1] || 'i', id: m[2] }
}

async function viaFx(url) {
    const { user, id } = await parseTweetUrl(url)
    const r = await httpGet(`https://api.fxtwitter.com/${user}/status/${id}`, { json: true })
    if (r.status === 404) throw new DlError('fxtwitter: tweet tidak ditemukan / privat', 'NOT_FOUND')
    const t = r.data?.tweet
    if (r.status !== 200 || !t) throw new DlError(`fxtwitter: HTTP ${r.status}`)
    const media = []
    for (const v of t.media?.videos || []) media.push({ type: 'video', url: v.url })
    if (!media.length) for (const p of t.media?.photos || []) media.push({ type: 'image', url: p.url })
    // Tweet kutipan: ambil media dari tweet yang dikutip kalau tweet utama kosong
    if (!media.length && t.quote?.media) {
        for (const v of t.quote.media.videos || []) media.push({ type: 'video', url: v.url })
        for (const p of t.quote.media.photos || []) media.push({ type: 'image', url: p.url })
    }
    return buildResult({
        platform: 'Twitter/X', source: 'fxtwitter',
        title: t.text, author: t.author?.screen_name ? `@${t.author.screen_name}` : t.author?.name,
        thumbnail: t.media?.videos?.[0]?.thumbnail_url, media
    })
}

async function viaVx(url) {
    const { user, id } = await parseTweetUrl(url)
    const r = await httpGet(`https://api.vxtwitter.com/${user}/status/${id}`, { json: true })
    const d = r.data
    if (r.status !== 200 || !d || typeof d !== 'object') throw new DlError(`vxtwitter: HTTP ${r.status}`)
    const media = (d.media_extended || []).map(x => ({ type: x.type === 'image' ? 'image' : 'video', url: x.url }))
    if (!media.length) for (const u of d.mediaURLs || []) media.push({ type: /\.(jpe?g|png|webp)/i.test(u) ? 'image' : 'video', url: u })
    return buildResult({
        platform: 'Twitter/X', source: 'vxtwitter',
        title: d.text, author: d.user_screen_name ? `@${d.user_screen_name}` : d.user_name, media
    })
}

export const TWITTER_DOMAINS = ['twitter.com', 'x.com', 't.co', 'mobile.twitter.com', 'fxtwitter.com', 'vxtwitter.com']

export const getTwitterMedia = url => runProviders('Twitter/X', [apiMain, viaFx, viaVx], url)
