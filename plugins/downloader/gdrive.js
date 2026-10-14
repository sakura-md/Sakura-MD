/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getGdriveMedia, GDRIVE_DOMAINS } from '../../lib/scrape/gdrivedl.js'

export default socialDownloader({
    names: ['gdrive', 'drive'],
    title: 'Google Drive',
    desc: 'Download file Google Drive publik',
    domains: GDRIVE_DOMAINS,
    example: 'https://drive.google.com/file/d/xxxx/view',
    scrape: getGdriveMedia
})
