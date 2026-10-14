/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getLikeeMedia, LIKEE_DOMAINS } from '../../lib/scrape/likeedl.js'

export default socialDownloader({
    names: ['likee', 'like'],
    title: 'Likee',
    desc: 'Download video Likee',
    domains: LIKEE_DOMAINS,
    example: 'https://likee.video/@user/video/123',
    scrape: getLikeeMedia
})
