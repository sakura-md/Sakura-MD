/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getYtmp4Media } from '../../lib/scrape/ytmp4dl.js'
import { YOUTUBE_DOMAINS } from '../../lib/scrape/youtubedl.js'

export default socialDownloader({
    names: ['ytmp4', 'ytv', 'ytvideo'],
    title: 'YouTube MP4',
    desc: 'Download video YouTube (MP4)',
    domains: YOUTUBE_DOMAINS,
    example: 'https://youtu.be/xxxxxxxxxxx',
    scrape: getYtmp4Media
})
