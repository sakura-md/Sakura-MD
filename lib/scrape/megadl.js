/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Mega.nz: file/folder di-host ulang API (maks 150MB per file).
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Mega. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/mega'
const api = viaSakura('Mega', ENDPOINT, { kind: 'file' })

export const MEGA_DOMAINS = ['mega.nz', 'mega.io', 'mega.co.nz']

export const getMegaMedia = input => runProviders('Mega', [api], input)
