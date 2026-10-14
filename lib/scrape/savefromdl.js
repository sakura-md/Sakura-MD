/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// SaveFrom: video dari berbagai platform (YouTube, TikTok, Instagram, Twitter, Facebook, dll).
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura SaveFrom. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/savefrom'
const api = viaSakura('SaveFrom', ENDPOINT, { kind: 'video' })

export const SAVEFROM_DOMAINS = []

export const getSavefromMedia = input => runProviders('SaveFrom', [api], input)
