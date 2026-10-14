/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getSoundcloudMedia, SOUNDCLOUD_DOMAINS } from '../../lib/scrape/soundclouddl.js'

export default socialDownloader({
    names: ['soundcloud', 'scdl'],
    title: 'SoundCloud',
    desc: 'Download lagu SoundCloud (MP3)',
    domains: SOUNDCLOUD_DOMAINS,
    example: 'https://soundcloud.com/artist/track',
    scrape: getSoundcloudMedia
})
