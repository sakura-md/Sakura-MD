/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Instagram (reel, post, carousel, IGTV) PUBLIK. Story / akun privat butuh login -> tidak didukung.
// Sumber: API Sakura -> halaman embed resmi instagram.com/p/<kode>/embed -> halaman utama (og:video) .
import { DlError, httpGet, resolveUrl, hostMatches, metaContent, decodeHtml, unescapeJsonString, buildResult, runProviders, viaSakura, UA_DESKTOP } from './dlcommon.js'

// Endpoint API Sakura Instagram (sumber utama). Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/instagram'
const apiMain = viaSakura('Instagram', ENDPOINT)


const CODE_RE = /\/(?:p|reels?|tv)\/([A-Za-z0-9_-]{5,})/

async function shortcodeOf(input) {
    let url = String(input).trim()
    if (/\/share\//.test(url) || hostMatches(url, ['instagr.am'])) url = await resolveUrl(url)
    if (/\/stories\//.test(url)) throw new DlError('Story Instagram butuh login, tidak bisa didownload.', 'UNSUPPORTED')
    const m = new URL(url).pathname.match(CODE_RE)
    if (!m) throw new DlError('Link Instagram tidak valid (harus link reel / post publik).', 'INVALID_URL')
    return m[1]
}

function mediaFromNode(node, out) {
    if (!node || typeof node !== 'object') return
    const children = node.edge_sidecar_to_children?.edges
    if (Array.isArray(children) && children.length) {
        for (const c of children) mediaFromNode(c.node, out)
        return
    }
    if (node.video_url) out.push({ type: 'video', url: node.video_url })
    else if (node.display_url) out.push({ type: 'image', url: node.display_url })
}

async function viaEmbed(url) {
    const code = await shortcodeOf(url)
    const r = await httpGet(`https://www.instagram.com/p/${code}/embed/captioned/`, { headers: { 'User-Agent': UA_DESKTOP, Referer: 'https://www.instagram.com/' } })
    const html = String(r.data || '')
    if (r.status !== 200 || html.length < 500) throw new DlError(`embed: HTTP ${r.status}`)

    const media = []
    let title = '', author = ''

    // contextJSON berisi data post lengkap (termasuk carousel)
    const ctx = html.match(/"contextJSON":"((?:[^"\\]|\\.)*)"/)
    if (ctx) {
        try {
            const obj = JSON.parse(JSON.parse(`"${ctx[1]}"`))
            const node = obj?.context?.media || obj?.gql_data?.shortcode_media || obj?.shortcode_media
            mediaFromNode(node, media)
            title = node?.edge_media_to_caption?.edges?.[0]?.node?.text || obj?.context?.caption || ''
            author = node?.owner?.username || obj?.context?.owner?.username || ''
        } catch {}
    }
    // Cadangan: ambil langsung dari teks halaman
    if (!media.length) {
        const vid = html.match(/"video_url":"([^"]+)"/)
        if (vid) media.push({ type: 'video', url: unescapeJsonString(vid[1]) })
    }
    if (!media.length) {
        const vtag = html.match(/<video[^>]+src=["']([^"']+)["']/i)
        if (vtag) media.push({ type: 'video', url: decodeHtml(vtag[1]) })
    }
    if (!media.length) {
        const img = html.match(/class=["'][^"']*EmbeddedMediaImage[^"']*["'][^>]*src=["']([^"']+)["']/i) || html.match(/"display_url":"([^"]+)"/)
        if (img) media.push({ type: 'image', url: img[1].startsWith('http') ? decodeHtml(img[1]) : unescapeJsonString(img[1]) })
    }
    if (!author) author = decodeHtml(html.match(/class=["']UsernameText["'][^>]*>([^<]+)</i)?.[1] || '')
    return buildResult({ platform: 'Instagram', source: 'ig-embed', title, author: author ? `@${author}` : '', media })
}

async function viaPage(url) {
    const code = await shortcodeOf(url)
    const r = await httpGet(`https://www.instagram.com/p/${code}/`, { mobile: true, headers: { Referer: 'https://www.instagram.com/' } })
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`halaman IG: HTTP ${r.status}`)
    const video = metaContent(html, 'og:video') || metaContent(html, 'og:video:secure_url')
    const image = metaContent(html, 'og:image')
    const media = video ? [{ type: 'video', url: video }] : image ? [{ type: 'image', url: image }] : []
    return buildResult({ platform: 'Instagram', source: 'ig-page', title: metaContent(html, 'og:title'), thumbnail: image, media })
}

export const INSTAGRAM_DOMAINS = ['instagram.com', 'instagr.am']

export const getInstagramMedia = url => runProviders('Instagram', [apiMain, viaEmbed, viaPage], url)
