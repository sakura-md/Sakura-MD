/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Google Drive: file publik (link langsung, validasi virus otomatis).
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Google Drive. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/gdrive'
const api = viaSakura('Google Drive', ENDPOINT, { kind: 'file' })

export const GDRIVE_DOMAINS = ['drive.google.com', 'docs.google.com']

export const getGdriveMedia = input => runProviders('Google Drive', [api], input)
