/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Douyin (TikTok China): video & audio tanpa watermark.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Douyin. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/douyin'
const api = viaSakura('Douyin', ENDPOINT, { kind: 'video' })

export const DOUYIN_DOMAINS = ['douyin.com', 'iesdouyin.com']

export const getDouyinMedia = input => runProviders('Douyin', [api], input)
