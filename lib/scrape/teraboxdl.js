/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// TeraBox: video/file (anti-limit & fast stream link).
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura TeraBox. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/terabox'
const api = viaSakura('TeraBox', ENDPOINT, { kind: 'file' })

export const TERABOX_DOMAINS = ['terabox.com', '1024terabox.com', 'teraboxapp.com', 'terabox.app', 'teraboxlink.com', '4funbox.com', 'mirrobox.com', 'nephobox.com', 'momerybox.com', 'freeterabox.com']

export const getTeraboxMedia = input => runProviders('TeraBox', [api], input)
