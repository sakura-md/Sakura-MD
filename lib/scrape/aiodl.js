/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// All-in-One: YouTube, TikTok, Instagram, Facebook, Twitter/X, SoundCloud, dan 1000+ platform.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura AIO. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/aio'
const api = viaSakura('AIO', ENDPOINT, { kind: 'video' })

export const AIO_DOMAINS = []

export const getAioMedia = input => runProviders('AIO', [api], input)
