/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// YouTube -> MP4 (API ytmp4). Cadangan: innertube / yt-dlp.
import { runProviders, viaSakura } from './dlcommon.js'
import { viaInnertube } from './youtubedl.js'

// Endpoint API Sakura YouTube MP4. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/ytmp4'
const api = viaSakura('YouTube MP4', ENDPOINT, { kind: 'video' })

export const getYtmp4Media = input => runProviders('YouTube MP4', [api, viaInnertube('video')], input)
