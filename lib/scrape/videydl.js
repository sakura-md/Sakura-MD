/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Videy: link video langsung dari halaman.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Videy. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/videy'
const api = viaSakura('Videy', ENDPOINT, { kind: 'video' })

export const VIDEY_DOMAINS = ['videy.co']

export const getVideyMedia = input => runProviders('Videy', [api], input)
