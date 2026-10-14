/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Spotify (URL): MP3 & cover lagu.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Spotify. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/spotify'
const api = viaSakura('Spotify', ENDPOINT, { kind: 'audio' })

export const SPOTIFY_DOMAINS = ['spotify.com', 'open.spotify.com', 'spotify.link']

export const getSpotifyMedia = input => runProviders('Spotify', [api], input)
