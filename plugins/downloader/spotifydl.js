/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getSpotifyMedia, SPOTIFY_DOMAINS } from '../../lib/scrape/spotifydl.js'

export default socialDownloader({
    names: ['spotifydl', 'spdl'],
    title: 'Spotify DL',
    desc: 'Download lagu Spotify dari URL (MP3)',
    domains: SPOTIFY_DOMAINS,
    example: 'https://open.spotify.com/track/xxxx',
    scrape: getSpotifyMedia
})
