/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Dailymotion: info & link stream video.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Dailymotion. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/dailymotion'
const api = viaSakura('Dailymotion', ENDPOINT, { kind: 'video' })

export const DAILYMOTION_DOMAINS = ['dailymotion.com', 'dai.ly']

export const getDailymotionMedia = input => runProviders('Dailymotion', [api], input)
