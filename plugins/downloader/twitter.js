/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getTwitterMedia, TWITTER_DOMAINS } from '../../lib/scrape/twitterdl.js'

export default socialDownloader({
    names: ['twitter', 'x', 'twdl'],
    title: 'Twitter/X',
    desc: 'Download media Twitter/X publik',
    domains: TWITTER_DOMAINS,
    example: 'https://x.com/user/status/123',
    scrape: getTwitterMedia
})
