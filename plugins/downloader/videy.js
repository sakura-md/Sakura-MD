/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getVideyMedia, VIDEY_DOMAINS } from '../../lib/scrape/videydl.js'

export default socialDownloader({
    names: ['videy'],
    title: 'Videy',
    desc: 'Download video Videy',
    domains: VIDEY_DOMAINS,
    example: 'https://videy.co/v?id=xxxx',
    scrape: getVideyMedia
})
