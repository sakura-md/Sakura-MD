/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// NPMJS: info package + tarball .tgz. Menerima link npmjs.com atau nama package.
import { runProviders, viaSakura, infoLines } from './dlcommon.js'

// Endpoint API Sakura NPMJS. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/npmjs'
const describe = o => infoLines(o, [['🔖 Versi', ['version', 'latest']], ['📄 Lisensi', ['license']], ['👤 Author', ['author']], ['📦 Dependensi', ['dependencies_count', 'dependenciesCount']]])
const api = viaSakura('NPMJS', ENDPOINT, { kind: 'file', describe })

export const NPMJS_DOMAINS = ['npmjs.com']

const normalize = input => /^https?:\/\//i.test(input) ? input : `https://www.npmjs.com/package/${String(input).trim()}`
export const getNpmjsMedia = input => runProviders('NPMJS', [api], normalize(input))
