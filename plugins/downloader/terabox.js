/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getTeraboxMedia, TERABOX_DOMAINS } from '../../lib/scrape/teraboxdl.js'

export default socialDownloader({
    names: ['terabox', 'tb'],
    title: 'TeraBox',
    desc: 'Download video/file TeraBox',
    domains: TERABOX_DOMAINS,
    example: 'https://terabox.com/s/xxxx',
    scrape: getTeraboxMedia
})
