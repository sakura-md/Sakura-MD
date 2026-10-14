/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper CapCut (template / video yang dibagikan). Sumber: halaman publik CapCut -> (opsional) SakuraApis.
// Link yang didukung: capcut.com/t/xxxx, capcut.com/template-detail/<id>, capcut.com/tv2/xxxx, capcut.com/share/...
import { DlError, httpGet, resolveUrl, metaContent, pageTitle, scriptJsons, unescapeJsonString, buildResult, runProviders, viaSakura, uniq } from './dlcommon.js'

// Endpoint API cadangan CapCut (opsional). Base URL & API key ada di config.js -> api (global).
const ENDPOINT = '/api/v1/downloader/save'
const fallbackApi = viaSakura('CapCut', ENDPOINT)


const KEYS = ['video_url', 'videoUrl', 'playUrl', 'play_url', 'contentUrl', 'video_addr', 'url_origin', 'originVideoUrl']

function deepFind(node, out = [], depth = 0) {
    if (!node || depth > 10) return out
    if (Array.isArray(node)) { node.forEach(n => deepFind(n, out, depth + 1)); return out }
    if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            if (typeof v === 'string' && KEYS.includes(k) && /^https?:\/\//.test(v) && !/\.(?:jpe?g|png|webp)(?:\?|$)/i.test(v)) out.push(v)
            else deepFind(v, out, depth + 1)
        }
    }
    return out
}

async function viaPage(url) {
    const final = await resolveUrl(url)
    const r = await httpGet(final, { headers: { Referer: 'https://www.capcut.com/' } })
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`halaman capcut: HTTP ${r.status}`)

    const nextData = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]
    let parsed = []
    if (nextData) { try { parsed = [JSON.parse(nextData)] } catch {} }

    const fromJson = deepFind([...scriptJsons(html), ...parsed])
    const fromText = [...html.matchAll(/"(?:video_url|videoUrl|playUrl|play_url|contentUrl)":"(https?:[^"]+)"/g)].map(m => unescapeJsonString(m[1]))
    const og = metaContent(html, 'og:video') || metaContent(html, 'og:video:url')
    const list = uniq([...fromJson, ...fromText, og]).filter(u => /^https?:\/\//.test(u))
    if (!list.length) throw new DlError('link video tidak ditemukan (template tidak publik atau format halaman berubah)', 'NO_MEDIA')

    return buildResult({
        platform: 'CapCut', source: 'capcut-page',
        title: metaContent(html, 'og:title') || pageTitle(html), thumbnail: metaContent(html, 'og:image'),
        media: [{ type: 'video', url: list[0], alts: list.slice(1, 3) }]
    })
}

export const CAPCUT_DOMAINS = ['capcut.com', 'capcut.net', 'capcutapp.com']

export const getCapcutMedia = url => runProviders('CapCut', [viaPage, fallbackApi], url)
