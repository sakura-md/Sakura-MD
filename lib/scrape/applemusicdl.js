/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Apple Music: MP3 lagu atau daftar lagu dari playlist/album.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Apple Music. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/applemusic'
const api = viaSakura('Apple Music', ENDPOINT, { kind: 'audio' })

export const APPLEMUSIC_DOMAINS = ['music.apple.com', 'itunes.apple.com', 'apple.com']

export const getAppleMusicMedia = input => runProviders('Apple Music', [api], input)
