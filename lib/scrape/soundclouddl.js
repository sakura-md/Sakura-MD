/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// SoundCloud: stream langsung (MP3) dari URL track.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura SoundCloud. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/soundcloud'
const api = viaSakura('SoundCloud', ENDPOINT, { kind: 'audio' })

export const SOUNDCLOUD_DOMAINS = ['soundcloud.com', 'on.soundcloud.com', 'm.soundcloud.com']

export const getSoundcloudMedia = input => runProviders('SoundCloud', [api], input)
