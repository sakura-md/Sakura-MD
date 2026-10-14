/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getDouyinMedia, DOUYIN_DOMAINS } from '../../lib/scrape/douyindl.js'

export default socialDownloader({
    names: ['douyin', 'dy'],
    title: 'Douyin',
    desc: 'Download video Douyin tanpa watermark',
    domains: DOUYIN_DOMAINS,
    example: 'https://v.douyin.com/xxxx',
    scrape: getDouyinMedia
})
