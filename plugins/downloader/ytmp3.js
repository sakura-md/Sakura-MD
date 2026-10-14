/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getYtmp3Media } from '../../lib/scrape/ytmp3dl.js'
import { YOUTUBE_DOMAINS } from '../../lib/scrape/youtubedl.js'

export default socialDownloader({
    names: ['ytmp3', 'yta', 'ytaudio'],
    title: 'YouTube MP3',
    desc: 'Download audio YouTube (MP3)',
    domains: YOUTUBE_DOMAINS,
    example: 'https://youtu.be/xxxxxxxxxxx',
    scrape: getYtmp3Media
})
