/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// GitHub: info repo (star, fork, lisensi, bahasa, topik) + source code ZIP.
import { runProviders, viaSakura, infoLines } from './dlcommon.js'

// Endpoint API Sakura GitHub. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/github'
const describe = o => infoLines(o, [['⭐ Star', ['stars', 'stargazers_count', 'stargazers']], ['🍴 Fork', ['forks', 'forks_count']], ['📄 Lisensi', ['license']], ['💻 Bahasa', ['language']], ['🏷️ Topik', ['topics']]])
const api = viaSakura('GitHub', ENDPOINT, { kind: 'file', describe })

export const GITHUB_DOMAINS = ['github.com']

export const getGithubMedia = input => runProviders('GitHub', [api], input)
