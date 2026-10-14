/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getNpmjsMedia, NPMJS_DOMAINS } from '../../lib/scrape/npmjsdl.js'

export default socialDownloader({
    names: ['npmjs', 'npmdl'],
    title: 'NPMJS',
    desc: 'Info package + download tarball',
    domains: NPMJS_DOMAINS,
    example: 'axios',
    scrape: getNpmjsMedia,
    allowQuery: true
})
