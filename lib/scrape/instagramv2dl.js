/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Instagram V2 (video/reel/post): provider kedua, beda engine dari endpoint /instagram.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Instagram V2. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/instagram-v2'
const api = viaSakura('Instagram V2', ENDPOINT, { kind: 'video' })

export const INSTAGRAMV2_DOMAINS = ['instagram.com', 'instagr.am']

export const getInstagramV2Media = input => runProviders('Instagram V2', [api], input)
