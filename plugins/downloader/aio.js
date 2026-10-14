/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getAioMedia, AIO_DOMAINS } from '../../lib/scrape/aiodl.js'

export default socialDownloader({
    names: ['aio', 'allinone'],
    title: 'AIO Downloader',
    desc: 'Download dari 1000+ platform (all-in-one)',
    domains: AIO_DOMAINS,
    example: 'https://vt.tiktok.com/xxxx',
    scrape: getAioMedia
})
