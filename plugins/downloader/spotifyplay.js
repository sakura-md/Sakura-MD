/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getPlaySpotifyMedia } from '../../lib/scrape/playspotifydl.js'

export default socialDownloader({
    names: ['spotifyplay', 'spplay'],
    title: 'Spotify Play',
    desc: 'Cari & download lagu Spotify (MP3)',
    example: 'nama lagu',
    scrape: getPlaySpotifyMedia,
    maxItems: 1,
    allowQuery: true
})
