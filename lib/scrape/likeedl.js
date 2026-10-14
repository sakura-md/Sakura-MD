/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper Likee (video tanpa login). Sumber: API info video Likee (post id) -> halaman web -> (opsional) SakuraApis.
import axios from 'axios'
import { DlError, httpGet, resolveUrl, hostMatches, metaContent, pageTitle, unescapeJsonString, buildResult, runProviders, viaSakura, UA_MOBILE } from './dlcommon.js'

// Endpoint API cadangan Likee (opsional). Base URL & API key ada di config.js -> api (global).
const ENDPOINT = '/api/v1/downloader/save'
const fallbackApi = viaSakura('Likee', ENDPOINT)


async function postIdOf(input) {
    let url = String(input).trim()
    let id = url.match(/\/video\/(\d{6,25})/)?.[1] || url.match(/[?&]postId=(\d{6,25})/i)?.[1]
    if (!id) {
        url = await resolveUrl(url, { mobile: true }) // l.likee.video/v/xxx, likee.com/l/xxx
        id = url.match(/\/video\/(\d{6,25})/)?.[1] || url.match(/[?&]postId=(\d{6,25})/i)?.[1]
    }
    if (!id) throw new DlError('Link Likee tidak valid (post id tidak ditemukan).', 'INVALID_URL')
    return { id, url }
}

async function viaApi(url) {
    const { id } = await postIdOf(url)
    const res = await axios.post(
        'https://api.like-video.com/likee-activity-flow-micro/videoApi/getVideoInfo',
        new URLSearchParams({ postIds: id }).toString(),
        { timeout: 20000, validateStatus: () => true, headers: { 'User-Agent': UA_MOBILE, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const item = res.data?.data?.videoList?.[0]
    if (res.status !== 200 || !item) throw new DlError(`likee-api: ${res.data?.msg || `HTTP ${res.status}`}`)
    const video = item.videoUrl || item.playUrl
    if (!video) throw new DlError('likee-api: link video kosong')
    return buildResult({
        platform: 'Likee', source: 'likee-api',
        title: item.msgText || item.title || '', author: item.nickname || item.userName || '',
        thumbnail: item.coverUrl || item.cover || '', media: [{ type: 'video', url: video }]
    })
}

async function viaPage(url) {
    const { id } = await postIdOf(url)
    const r = await httpGet(`https://likee.video/video/${id}`, { mobile: true })
    const html = String(r.data || '')
    if (r.status !== 200) throw new DlError(`halaman likee: HTTP ${r.status}`)
    const raw = metaContent(html, 'og:video') || metaContent(html, 'og:video:url')
        || unescapeJsonString(html.match(/"(?:video_url|videoUrl|playUrl)":"([^"]+)"/)?.[1] || '')
    return buildResult({
        platform: 'Likee', source: 'likee-page', title: metaContent(html, 'og:title') || pageTitle(html),
        thumbnail: metaContent(html, 'og:image'), media: raw ? [{ type: 'video', url: raw }] : []
    })
}

export const LIKEE_DOMAINS = ['likee.video', 'likee.com', 'like-video.com', 'l.likee.video']

export const getLikeeMedia = url => runProviders('Likee', [viaApi, viaPage, fallbackApi], url)
