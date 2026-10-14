/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Bilibili: link / BV ID (audio-video digabung API via ffmpeg).
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Bilibili. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/bilibili'
const api = viaSakura('Bilibili', ENDPOINT, { kind: 'video' })

export const BILIBILI_DOMAINS = ['bilibili.com', 'bilibili.tv', 'b23.tv']

export const getBilibiliMedia = input => runProviders('Bilibili', [api], input)
