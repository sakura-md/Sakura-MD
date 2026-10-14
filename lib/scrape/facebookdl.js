/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Facebook (video / reel PUBLIK). Video privat / grup tertutup tidak bisa diunduh.
// Sumber: API Sakura -> halaman web desktop -> halaman mobile (m.facebook.com) .
import { DlError, httpGet, resolveUrl, hostMatches, metaContent, pageTitle, unescapeJsonString, buildResult, runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Facebook (sumber utama). Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/facebook'
const apiMain = viaSakura('Facebook', ENDPOINT)


const PICKS = [
    ['hd', /"(?:browser_native_hd_url|playable_url_quality_hd|hd_src_no_ratelimit|hd_src)":"([^"]+)"/],
    ['sd', /"(?:browser_native_sd_url|playable_url|sd_src_no_ratelimit|sd_src)":"([^"]+)"/]
]

function extractVideos(html) {
    const found = {}
    for (const [quality, re] of PICKS) {
        const m = html.match(re)
        if (m) found[quality] = unescapeJsonString(m[1])
    }
    const og = metaContent(html, 'og:video:url') || metaContent(html, 'og:video')
    if (!found.sd && !found.hd && og) found.sd = og
    return found
}

async function fetchVideoPage(url, mobile) {
    let target = String(url).trim()
    if (hostMatches(target, ['fb.watch']) || /\/share\/[vr]\//.test(target)) target = await resolveUrl(target, { mobile })
    if (mobile) target = target.replace(/^https?:\/\/(?:www\.|web\.)?facebook\.com/i, 'https://m.facebook.com')
    const r = await httpGet(target, { mobile, headers: { 'Sec-Fetch-Mode': 'navigate', 'Upgrade-Insecure-Requests': '1' } })
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`HTTP ${r.status}`)
    if (/\/login\/|checkpoint/i.test(r.finalUrl) && !/hd_src|sd_src|playable_url/.test(html)) {
        throw new DlError('video privat / butuh login', 'PRIVATE')
    }
    const found = extractVideos(html)
    if (!found.hd && !found.sd) throw new DlError('link video tidak ditemukan di halaman (video privat atau format baru)', 'NO_MEDIA')
    const best = found.hd || found.sd
    const alts = [found.hd && found.sd ? found.sd : ''].filter(Boolean)
    return buildResult({
        platform: 'Facebook', source: mobile ? 'fb-mobile' : 'fb-web',
        title: pageTitle(html), thumbnail: metaContent(html, 'og:image'),
        media: [{ type: 'video', url: best, alts, quality: found.hd ? 'HD' : 'SD' }]
    })
}

const viaWeb = url => fetchVideoPage(url, false)
const viaMobile = url => fetchVideoPage(url, true)

export const FACEBOOK_DOMAINS = ['facebook.com', 'fb.watch', 'fb.com', 'fb.me']

export const getFacebookMedia = url => runProviders('Facebook', [apiMain, viaWeb, viaMobile], url)
