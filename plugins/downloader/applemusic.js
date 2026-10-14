/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getAppleMusicMedia, APPLEMUSIC_DOMAINS } from '../../lib/scrape/applemusicdl.js'

export default socialDownloader({
    names: ['applemusic', 'am'],
    title: 'Apple Music',
    desc: 'Download lagu Apple Music (MP3)',
    domains: APPLEMUSIC_DOMAINS,
    example: 'https://music.apple.com/id/album/xxxx',
    scrape: getAppleMusicMedia,
    maxItems: 5
})
