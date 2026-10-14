/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getInstagramV2Media, INSTAGRAMV2_DOMAINS } from '../../lib/scrape/instagramv2dl.js'

export default socialDownloader({
    names: ['instagramv2', 'igv2', 'ig2'],
    title: 'Instagram V2',
    desc: 'Download Instagram (provider kedua)',
    domains: INSTAGRAMV2_DOMAINS,
    example: 'https://www.instagram.com/reel/xxxx',
    scrape: getInstagramV2Media
})
