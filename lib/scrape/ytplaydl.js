/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// YouTube Play (cari kata kunci) -> MP3 hasil teratas. Cadangan: innertube.
import { runProviders, viaSakura } from './dlcommon.js'
import { viaInnertube } from './youtubedl.js'

// Endpoint API Sakura YouTube Play. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/ytplay'
const api = viaSakura('YouTube Play', ENDPOINT, { kind: 'audio', param: 'query' })

export const getYtplayMedia = input => runProviders('YouTube Play', [api, viaInnertube('audio')], input)
