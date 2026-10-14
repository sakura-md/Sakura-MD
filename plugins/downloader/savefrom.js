/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getSavefromMedia, SAVEFROM_DOMAINS } from '../../lib/scrape/savefromdl.js'

export default socialDownloader({
    names: ['savefrom', 'sf'],
    title: 'SaveFrom',
    desc: 'Download video dari berbagai platform',
    domains: SAVEFROM_DOMAINS,
    example: 'https://www.youtube.com/watch?v=xxxx',
    scrape: getSavefromMedia
})
