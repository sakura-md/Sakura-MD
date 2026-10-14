/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// YouTube downloader dengan API Sakura dan fallback Innertube.

import { DlError, buildResult, runProviders, viaSakura } from './dlcommon.js'
import { searchYoutube, getYoutubeDirectUrl, getYoutubeAudioUrl } from './youtube.js'

const ENDPOINT = '/api/v1/downloader/youtubedl'

export const YOUTUBE_DOMAINS = [
    'youtube.com',
    'youtu.be',
    'music.youtube.com',
    'm.youtube.com'
]

export const YT_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/

const minutes = s => (
    s > 0
        ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
        : ''
)

// Fallback Innertube untuk video dan audio YouTube.
export function viaInnertube(kind = 'video', quality = '360') {
    return async input => {
        const target = YT_RE.test(input)
            ? input
            : await searchYoutube(input)

        const result = kind === 'audio'
            ? await getYoutubeAudioUrl(target)
            : await getYoutubeDirectUrl(target, quality)

        if (kind !== 'audio' && !result.hasAudio) {
            throw new DlError(
                'Hanya tersedia stream video tanpa suara untuk video ini.',
                'NO_AUDIO'
            )
        }

        return buildResult({
            platform: 'YouTube',
            source: `innertube-${result.client}`,
            title: result.title,
            author: result.author,
            thumbnail: result.thumb,
            duration: minutes(result.duration),
            media: [{
                type: kind === 'audio' ? 'audio' : 'video',
                url: result.url,
                headers: result.headers,
                mime: result.mime
            }]
        })
    }
}

// Download YouTube menggunakan endpoint API Sakura dan fallback Innertube.
export const getYoutubeDlMedia = input =>
    runProviders(
        'YouTube',
        [
            viaSakura('YouTube', ENDPOINT, {
                kind: 'video',
                maxQuality: 720
            }),
            viaInnertube('video')
        ],
        input
    )

// Kompatibilitas untuk plugin yang memanggil getYoutubeMedia.
export const getYoutubeMedia = (input, kind = 'video', quality = '360') => {
    if (kind === 'audio') {
        return viaInnertube('audio')(input)
    }

    if (quality === '360') {
        return getYoutubeDlMedia(input)
    }

    return viaInnertube('video', quality)(input)
}