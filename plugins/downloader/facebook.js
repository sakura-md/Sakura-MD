/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getFacebookMedia, FACEBOOK_DOMAINS } from '../../lib/scrape/facebookdl.js'

export default socialDownloader({
    names: ['facebook', 'fb', 'fbdl'],
    title: 'Facebook',
    desc: 'Download video Facebook publik',
    domains: FACEBOOK_DOMAINS,
    example: 'https://fb.watch/xxxx',
    scrape: getFacebookMedia
})
