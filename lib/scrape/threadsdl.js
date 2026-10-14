/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Threads: foto & video (multi-media), link /post/ maupun /share/.
import { runProviders, viaSakura } from './dlcommon.js'

// Endpoint API Sakura Threads. Base URL & API key ada di config.js -> api.
const ENDPOINT = '/api/v1/downloader/threads'
const api = viaSakura('Threads', ENDPOINT, { kind: 'video' })

export const THREADS_DOMAINS = ['threads.net', 'threads.com']

export const getThreadsMedia = input => runProviders('Threads', [api], input)
