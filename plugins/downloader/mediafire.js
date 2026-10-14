/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getMediafireMedia, MEDIAFIRE_DOMAINS } from '../../lib/scrape/mediafiredl.js'

export default socialDownloader({
    names: ['mediafire', 'mf'],
    title: 'MediaFire',
    desc: 'Download file MediaFire',
    domains: MEDIAFIRE_DOMAINS,
    example: 'https://www.mediafire.com/file/xxxx',
    scrape: getMediafireMedia
})
