/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getSnackVideoMedia, SNACKVIDEO_DOMAINS } from '../../lib/scrape/snackvideodl.js'

export default socialDownloader({
    names: ['snackvideo', 'snack', 'sv'],
    title: 'Snack Video',
    desc: 'Download video Snack Video',
    domains: SNACKVIDEO_DOMAINS,
    example: 'https://s.snackvideo.com/p/xxxx',
    scrape: getSnackVideoMedia
})
