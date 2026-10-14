/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Pinterest (foto kualitas asli & video). Sumber: pidgets API publik -> halaman pin -> (opsional) SakuraApis.
import { DlError, httpGet, resolveUrl, hostMatches, metaContent, pageTitle, unescapeJsonString, buildResult, runProviders, viaSakura } from './dlcommon.js'

// Endpoint API cadangan Pinterest (opsional). Base URL & API key ada di config.js -> api (global).
const ENDPOINT = '/api/v1/downloader/save'
const fallbackApi = viaSakura('Pinterest', ENDPOINT)


async function pinIdOf(input) {
    let url = String(input).trim()
    if (hostMatches(url, ['pin.it'])) url = await resolveUrl(url)
    const m = url.match(/\/pin\/(?:[^/?#]*--)?(\d{6,25})/)
    if (!m) throw new DlError('Link Pinterest tidak valid (harus link pin).', 'INVALID_URL')
    return m[1]
}

const toOriginal = u => String(u).replace(/\/(?:\d+x\d*|\d+x)\//, '/originals/')

async function viaPidgets(url) {
    const id = await pinIdOf(url)
    const r = await httpGet('https://widgets.pinterest.com/v3/pidgets/pins/info/', { params: { pin_ids: id }, json: true })
    const pin = r.data?.data?.[0]
    if (r.status !== 200 || !pin) throw new DlError(`pidgets: HTTP ${r.status}`)
    const list = pin.videos?.video_list || {}
    const mp4 = Object.values(list).filter(v => v?.url && /\.mp4/i.test(v.url)).sort((a, b) => (b.width || 0) - (a.width || 0))
    const media = mp4.length
        ? [{ type: 'video', url: mp4[0].url }]
        : pin.images?.orig?.url ? [{ type: 'image', url: pin.images.orig.url }] : []
    return buildResult({
        platform: 'Pinterest', source: 'pidgets',
        title: pin.description || pin.grid_title || '', author: pin.pinner?.username ? `@${pin.pinner.username}` : '',
        thumbnail: pin.images?.['237x']?.url, media
    })
}

async function viaPage(url) {
    const id = await pinIdOf(url)
    const r = await httpGet(`https://www.pinterest.com/pin/${id}/`)
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`halaman pin: HTTP ${r.status}`)

    const videos = [...html.matchAll(/https?:\\?\/\\?\/v\d*\.pinimg\.com\\?\/videos\\?\/[^"'\s<]+?\.mp4/g)]
        .map(m => unescapeJsonString(m[0]))
    const ogVideo = metaContent(html, 'og:video') || metaContent(html, 'og:video:url')
    const image = metaContent(html, 'og:image')
    const media = []
    const bestVideo = videos.find(v => /720p|1080p/i.test(v)) || videos[0] || (/\.mp4/i.test(ogVideo) ? ogVideo : '')
    if (bestVideo) media.push({ type: 'video', url: bestVideo })
    else if (image) media.push({ type: 'image', url: toOriginal(image), alts: [image] })
    return buildResult({ platform: 'Pinterest', source: 'pin-page', title: metaContent(html, 'og:title') || pageTitle(html), thumbnail: image, media })
}

export const PINTEREST_DOMAINS = ['pinterest.com', 'pin.it', 'pinterest.co.id', 'id.pinterest.com']

export const getPinterestMedia = url => runProviders('Pinterest', [viaPidgets, viaPage, fallbackApi], url)
