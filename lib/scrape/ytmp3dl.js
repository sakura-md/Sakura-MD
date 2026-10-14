/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// YouTube -> MP3 (API ytmp3). Cadangan: innertube / yt-dlp.
import { runProviders, viaSakura } from './dlcommon.js'
import { viaInnertube } from './youtubedl.js'

// Endpoint API Sakura YouTube MP3. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/ytmp3'
const api = viaSakura('YouTube MP3', ENDPOINT, { kind: 'audio' })

export const getYtmp3Media = input => runProviders('YouTube MP3', [api, viaInnertube('audio')], input)
