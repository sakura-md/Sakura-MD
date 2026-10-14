/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getDailymotionMedia, DAILYMOTION_DOMAINS } from '../../lib/scrape/dailymotiondl.js'

export default socialDownloader({
    names: ['dailymotion', 'dm'],
    title: 'Dailymotion',
    desc: 'Download video Dailymotion',
    domains: DAILYMOTION_DOMAINS,
    example: 'https://www.dailymotion.com/video/xxxx',
    scrape: getDailymotionMedia
})
