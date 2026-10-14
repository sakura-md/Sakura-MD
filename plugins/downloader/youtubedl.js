/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getYoutubeDlMedia } from '../../lib/scrape/youtubedl.js'
import { YOUTUBE_DOMAINS } from '../../lib/scrape/youtubedl.js'

export default socialDownloader({
    names: ['youtubedl', 'ytall'],
    title: 'YouTube DL',
    desc: 'Download video YouTube (info + semua format)',
    domains: YOUTUBE_DOMAINS,
    example: 'https://youtu.be/xxxxxxxxxxx',
    scrape: getYoutubeDlMedia
})
