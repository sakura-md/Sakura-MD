/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Scraper download TikTok (video tanpa watermark, slideshow foto, audio) dengan beberapa sumber cadangan.
// Urutan: api-faa.my.id -> tikwm.com. Satu sumber mati tidak lagi membuat .tiktok / .tiktokmp3 gagal total.
import axios from 'axios'
import { tikwmCall } from '../tiktokfeed.js'
import config from '../../config.js'
import { extractFromApi } from './dlextract.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const isUrl = v => typeof v === 'string' && /^https?:\/\//i.test(v.trim())
const urls = (...vals) => [...new Set(vals.flat().filter(isUrl).map(v => v.trim()))]

function secondsText(d) {
    if (d === undefined || d === null || d === '') return ''
    if (typeof d === 'number') return d > 0 ? `${d} detik` : ''
    return String(d).replace(/\s*seconds?/i, ' detik')
}

async function viaFaa(url) {
    const { data } = await axios.get('https://api-faa.my.id/faa/tiktok', { params: { url }, timeout: 30000, headers: { 'User-Agent': UA }, validateStatus: () => true })
    const r = data?.result
    if (!data || typeof data !== 'object' || data.status === false || !r) {
        throw new Error(`api-faa: ${data?.message || 'respon kosong / API tidak aktif'}`)
    }
    const images = urls(r.images || [])
    const videos = urls(r.data, r.video?.noWatermark, r.video?.no_watermark, r.play, r.url)
    if (!images.length && !videos.length) throw new Error('api-faa: tidak ada link media di respon')
    return {
        source: 'api-faa',
        title: r.title || '',
        duration: secondsText(r.duration),
        images,
        videos,
        audio: urls(r.music, r.audio, r.music_info?.play, r.music?.play_url)[0] || '',
        audioTitle: r.music_info?.title || ''
    }
}

async function viaTikwm(url) {
    const body = await tikwmCall('/api/', { url, hd: 1 })
    const d = body?.data
    if (!d) throw new Error('tikwm: respon kosong')
    const images = urls(d.images || [])
    const videos = urls(d.hdplay, d.play, d.wmplay)
    if (!images.length && !videos.length) throw new Error('tikwm: tidak ada link media di respon')
    return {
        source: 'tikwm',
        title: d.title || '',
        duration: secondsText(d.duration),
        images,
        videos,
        audio: urls(d.music, d.music_info?.play)[0] || '',
        audioTitle: d.music_info?.title || ''
    }
}

// Endpoint API Sakura TikTok DL (POST, url dikirim via form/query). Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/tiktok-dl'

async function viaSakura(url) {
    const apikey = String(config.api?.apikey || '').trim()
    if (!apikey) throw new Error('sakura-api: apikey di config.js (api.apikey) belum diisi')
    const base = String(config.api?.baseUrl || 'https://api.haidarxd.my.id').replace(/\/+$/, '')
    const { data, status } = await axios.post(`${base}${ENDPOINT}`, new URLSearchParams({ url }).toString(), {
        params: { apikey },
        timeout: 30000,
        validateStatus: () => true,
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    if (!data || typeof data !== 'object' || data.status === false || data.success === false) {
        throw new Error(`sakura-api: ${data?.message || `HTTP ${status}`}`)
    }
    const parsed = extractFromApi(data, { kind: 'video' })
    const images = urls(parsed.media.filter(m => m.type === 'image').map(m => m.url))
    const videos = urls(parsed.media.filter(m => m.type === 'video').flatMap(m => [m.url, ...(m.alts || [])]))
    const audio = parsed.media.find(m => m.type === 'audio')?.url || ''
    if (!images.length && !videos.length) throw new Error('sakura-api: tidak ada link media di respon')
    return { source: 'sakura-api', title: parsed.title, duration: secondsText(parsed.duration), images, videos, audio, audioTitle: '' }
}

const PROVIDERS = [viaFaa, viaTikwm, viaSakura]

export async function getTikTokMedia(url) {
    const errors = []
    for (const run of PROVIDERS) {
        try {
            return await run(url)
        } catch (e) {
            errors.push(e?.message || String(e))
        }
    }
    throw new Error(errors.join(' | '))
}

// Unduh dari daftar URL, pakai yang pertama berhasil. Mengembalikan { buffer, url }.
export async function downloadFirst(list, { maxBytes = 100 * 1024 * 1024, timeout = 120000 } = {}) {
    let last = null
    for (const url of list) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout,
                maxContentLength: maxBytes,
                maxBodyLength: maxBytes,
                headers: { 'User-Agent': UA, Referer: 'https://www.tiktok.com/' }
            })
            const buffer = Buffer.from(res.data || [])
            if (buffer.length < 1000) throw new Error('file kosong')
            return { buffer, url }
        } catch (e) {
            last = e
        }
    }
    throw new Error(`Gagal mengunduh media${last ? ` (${last.response?.status ? 'HTTP ' + last.response.status : last.message})` : ''}`)
}