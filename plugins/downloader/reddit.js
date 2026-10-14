/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getRedditMedia, REDDIT_DOMAINS } from '../../lib/scrape/redditdl.js'

export default socialDownloader({
    names: ['reddit', 'rd'],
    title: 'Reddit',
    desc: 'Download video/foto Reddit',
    domains: REDDIT_DOMAINS,
    example: 'https://www.reddit.com/r/sub/comments/xxxx/judul/',
    scrape: getRedditMedia
})
