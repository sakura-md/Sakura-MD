/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { socialDownloader } from '../../lib/dlkit.js'
import { getGithubMedia, GITHUB_DOMAINS } from '../../lib/scrape/githubdl.js'

export default socialDownloader({
    names: ['github', 'gh'],
    title: 'GitHub',
    desc: 'Info repo + download source ZIP',
    domains: GITHUB_DOMAINS,
    example: 'https://github.com/user/repo',
    scrape: getGithubMedia
})
