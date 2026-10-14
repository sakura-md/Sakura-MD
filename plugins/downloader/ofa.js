/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getOfaMedia, OFA_DOMAINS } from '../../lib/scrape/ofadl.js'

// Satu perintah dua mode: .ofa <link> (video) dan .ofamp3 <link> (audio saja).
const video = socialDownloader({
    names: ['ofa', 'oneforall'],
    title: 'OFA Downloader',
    desc: 'Download video dari banyak situs (OFA)',
    domains: OFA_DOMAINS,
    example: 'https://www.youtube.com/watch?v=xxxx',
    scrape: url => getOfaMedia(url, { quality: 'any', format: 'mp4' })
})

const audio = socialDownloader({
    names: ['ofamp3', 'ofaaudio'],
    title: 'OFA MP3',
    desc: 'Download audio MP3 dari banyak situs (OFA)',
    domains: OFA_DOMAINS,
    example: 'https://www.youtube.com/watch?v=xxxx',
    scrape: url => getOfaMedia(url, { format: 'mp3' })
})

export default video
export const handlers = [audio]
