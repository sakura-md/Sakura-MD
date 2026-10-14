/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getCapcutMedia, CAPCUT_DOMAINS } from '../../lib/scrape/capcutdl.js'

export default socialDownloader({
    names: ['capcut', 'cc'],
    title: 'CapCut',
    desc: 'Download template/video CapCut',
    domains: CAPCUT_DOMAINS,
    example: 'https://www.capcut.com/t/xxxx',
    scrape: getCapcutMedia
})
