/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getPinterestMedia, PINTEREST_DOMAINS } from '../../lib/scrape/pinterestdl.js'

export default socialDownloader({
    names: ['pinterest', 'pindl'],
    title: 'Pinterest',
    desc: 'Download foto/video Pinterest',
    domains: PINTEREST_DOMAINS,
    example: 'https://pin.it/xxxx',
    scrape: getPinterestMedia
})
