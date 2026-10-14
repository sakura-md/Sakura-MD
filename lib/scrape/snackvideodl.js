/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Snack Video (video, utamakan versi tanpa watermark kalau ada).
// Sumber: halaman video (JSON-LD / data halaman / og:video) -> (opsional) SakuraApis.
import { DlError, httpGet, resolveUrl, metaContent, pageTitle, scriptJsons, unescapeJsonString, buildResult, runProviders, viaSakura, uniq } from './dlcommon.js'

// Endpoint API cadangan Snack Video (opsional). Base URL & API key ada di config.js -> api (global).
const ENDPOINT = '/api/v1/downloader/save'
const fallbackApi = viaSakura('Snack Video', ENDPOINT)


function deepFind(node, keys, out = [], depth = 0) {
    if (!node || depth > 8) return out
    if (Array.isArray(node)) { node.forEach(n => deepFind(n, keys, out, depth + 1)); return out }
    if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            if (typeof v === 'string' && keys.includes(k) && /^https?:\/\//.test(v)) out.push(v)
            else deepFind(v, keys, out, depth + 1)
        }
    }
    return out
}

async function viaPage(url) {
    const final = /snackvideo|sck\.io/i.test(url) ? await resolveUrl(url, { mobile: true }) : url
    const r = await httpGet(final, { mobile: true })
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`halaman snack: HTTP ${r.status}`)

    const jsons = scriptJsons(html)
    const noMark = uniq([
        ...deepFind(jsons, ['srcNoMark', 'urlNoMark', 'noWatermarkUrl', 'videoUrlNoMark']),
        ...[...html.matchAll(/"(?:srcNoMark|urlNoMark|noWatermarkUrl)":"([^"]+)"/g)].map(m => unescapeJsonString(m[1]))
    ])
    const marked = uniq([
        ...deepFind(jsons, ['contentUrl', 'videoUrl', 'playUrl', 'src']),
        metaContent(html, 'og:video'), metaContent(html, 'og:video:url'),
        ...[...html.matchAll(/"(?:contentUrl|videoUrl|playUrl)":"([^"]+\.mp4[^"]*)"/g)].map(m => unescapeJsonString(m[1]))
    ]).filter(u => /^https?:\/\//.test(u))

    const list = uniq([...noMark, ...marked])
    if (!list.length) throw new DlError('link video tidak ditemukan di halaman Snack Video', 'NO_MEDIA')
    return buildResult({
        platform: 'Snack Video', source: 'snack-page',
        title: metaContent(html, 'og:title') || pageTitle(html), thumbnail: metaContent(html, 'og:image'),
        media: [{ type: 'video', url: list[0], alts: list.slice(1, 3), quality: noMark.length ? 'Tanpa watermark' : '' }]
    })
}

export const SNACKVIDEO_DOMAINS = ['snackvideo.com', 'snackvideo.in', 'sck.io', 'snackvideo.id']

export const getSnackVideoMedia = url => runProviders('Snack Video', [viaPage, fallbackApi], url)
