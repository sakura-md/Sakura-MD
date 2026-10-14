/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// YouTube Play Video (cari kata kunci) -> MP4 hasil teratas. Cadangan: innertube.
import { runProviders, viaSakura } from './dlcommon.js'
import { viaInnertube } from './youtubedl.js'

// Endpoint API Sakura YouTube Play Video. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/ytplayvid'
const api = viaSakura('YouTube Play Video', ENDPOINT, { kind: 'video', param: 'query' })

export const getYtplayvidMedia = input => runProviders('YouTube Play Video', [api, viaInnertube('video')], input)
