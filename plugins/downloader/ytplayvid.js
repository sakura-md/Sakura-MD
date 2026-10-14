/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getYtplayvidMedia } from '../../lib/scrape/ytplayviddl.js'

export default socialDownloader({
    names: ['ytplayvid', 'ytpv'],
    title: 'YouTube Play Video',
    desc: 'Cari & download video YouTube',
    example: 'nama video',
    scrape: getYtplayvidMedia,
    maxItems: 1,
    allowQuery: true
})
