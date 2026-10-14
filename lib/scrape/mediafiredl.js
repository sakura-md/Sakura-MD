/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// MediaFire: info & link download file.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura MediaFire. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/mediafire'
const api = viaSakura('MediaFire', ENDPOINT, { kind: 'file' })

export const MEDIAFIRE_DOMAINS = ['mediafire.com']

export const getMediafireMedia = input => runProviders('MediaFire', [api], input)
