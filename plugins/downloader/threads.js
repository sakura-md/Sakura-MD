/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getThreadsMedia, THREADS_DOMAINS } from '../../lib/scrape/threadsdl.js'

export default socialDownloader({
    names: ['threads', 'th'],
    title: 'Threads',
    desc: 'Download foto/video Threads',
    domains: THREADS_DOMAINS,
    example: 'https://www.threads.net/@user/post/xxxx',
    scrape: getThreadsMedia
})
