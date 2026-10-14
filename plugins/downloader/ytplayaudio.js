/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getYtplayMedia } from '../../lib/scrape/ytplaydl.js'

export default socialDownloader({
    names: ['ytplayaudio', 'ytpa'],
    title: 'YouTube Play Audio',
    desc: 'Cari & download audio YouTube',
    example: 'nama lagu',
    scrape: getYtplayMedia,
    maxItems: 1,
    allowQuery: true
})
