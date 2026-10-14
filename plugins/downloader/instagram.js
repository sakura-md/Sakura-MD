/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getInstagramMedia, INSTAGRAM_DOMAINS } from '../../lib/scrape/instagramdl.js'

export default socialDownloader({
    names: ['instagram', 'ig', 'igdl'],
    title: 'Instagram',
    desc: 'Download reel/post Instagram publik',
    domains: INSTAGRAM_DOMAINS,
    example: 'https://www.instagram.com/reel/xxxx',
    scrape: getInstagramMedia
})
