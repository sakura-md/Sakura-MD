/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Spotify (cari kata kunci): ambil hasil teratas, kirim MP3 + info trek.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Spotify Play. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/playspotify'
const api = viaSakura('Spotify Play', ENDPOINT, { kind: 'audio', param: 'query' })

export const getPlaySpotifyMedia = input => runProviders('Spotify Play', [api], input)
