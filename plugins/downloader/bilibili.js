/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getBilibiliMedia, BILIBILI_DOMAINS } from '../../lib/scrape/bilibilidl.js'

export default socialDownloader({
    names: ['bilibili', 'bili'],
    title: 'Bilibili',
    desc: 'Download video Bilibili',
    domains: BILIBILI_DOMAINS,
    example: 'https://www.bilibili.com/video/BVxxxx',
    scrape: getBilibiliMedia
})
