/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getMegaMedia, MEGA_DOMAINS } from '../../lib/scrape/megadl.js'

export default socialDownloader({
    names: ['mega'],
    title: 'Mega',
    desc: 'Download file Mega.nz (maks 150MB)',
    domains: MEGA_DOMAINS,
    example: 'https://mega.nz/file/xxxx#xxxx',
    scrape: getMegaMedia
})
