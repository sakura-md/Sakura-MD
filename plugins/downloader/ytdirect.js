/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { socialDownloader } from '../../lib/dlkit.js'
import {
    getYoutubeMedia,
    YOUTUBE_DOMAINS
} from '../../lib/scrape/youtubedl.js'

// Download langsung video YouTube tanpa menu pilihan.
export default socialDownloader({
    names: ['ytdirect', 'yt-direct'],
    title: 'YouTube Direct MP4',
    desc: 'Download video YouTube langsung dari link atau judul.',
    domains: YOUTUBE_DOMAINS,
    example: 'https://youtu.be/xxxxxxxxxxx',
    allowQuery: true,
    scrape: input => getYoutubeMedia(input, 'video', '360')
})

// Download langsung audio YouTube tanpa menu pilihan.
export const handlers = [
    socialDownloader({
        names: ['ytdirectmp3', 'yt-directmp3'],
        title: 'YouTube Direct MP3',
        desc: 'Download audio YouTube langsung dari link atau judul.',
        domains: YOUTUBE_DOMAINS,
        example: 'https://youtu.be/xxxxxxxxxxx',
        allowQuery: true,
        scrape: input => getYoutubeMedia(input, 'audio')
    })
]