/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import axios from 'axios'
import { fileTypeFromBuffer } from 'file-type'
import config from '../config.js'
import logger from './logger.js'

const MB = 1024 * 1024
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'

export class ApiError extends Error {
    constructor(message, { code = 'API_ERROR', status = null, detail = null } = {}) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.status = status
        this.detail = detail
    }
}

const redact = text => String(text).replace(/(apikey=)[^&\s]+/gi, '$1***')
const log = (...args) => logger.api(...args.map(redact))
const logError = (...args) => logger.apiError(...args.map(redact))
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const truncate = (text, max = 1500) => {
    const str = String(text ?? '')
    return str.length > max ? `${str.slice(0, max)}…` : str
}

export const formatBytes = bytes => {
    const n = Number(bytes) || 0
    if (n >= MB) return `${(n / MB).toFixed(2)} MB`
    if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${n} B`
}

const DEFAULT_BASE_URL = 'https://api.haidarxd.my.id'

function httpMessage(status, body) {
    const fromBody = body && typeof body === 'object'
        ? body.message || body.msg || (typeof body.error === 'string' ? body.error : '') || ''
        : ''

    if (status === 401 || status === 403) return fromBody || 'API key tidak valid atau tidak punya akses ke endpoint ini.'
    if (status === 404) return fromBody || 'Endpoint / data tidak ditemukan (404).'
    if (status === 429) return fromBody || 'Rate limit API tercapai, coba lagi beberapa saat lagi.'
    if (status >= 500) return fromBody || `Server API sedang bermasalah (HTTP ${status}).`
    return fromBody || `API mengembalikan HTTP ${status}.`
}

function isErrorEnvelope(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return false
    if (json.status === false || json.success === false || json.ok === false) return true
    if (typeof json.status === 'string' && /^(error|fail|failed)$/i.test(json.status)) return true
    if (typeof json.statusCode === 'number' && json.statusCode >= 400) return true
    if (json.error) return true
    return false
}

function envelopeMessage(json) {
    return json.message || json.msg
        || (typeof json.error === 'string' ? json.error : '')
        || (json.error && typeof json.error === 'object' ? json.error.message || '' : '')
        || 'API mengembalikan error tanpa pesan.'
}

function parseResponse(res, label) {
    const status = res.status
    const contentType = String(res.headers?.['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase()

    const buffer = Buffer.from(res.data || [])

    if (status >= 200 && status < 300 && /^(image|video|audio)\//.test(contentType)) {
        if (!buffer.length) {
            throw new ApiError('Respon API kosong.', {
                code: 'EMPTY_RESPONSE',
                status
            })
        }

        return { binary: buffer, mime: contentType }
    }

    const text = buffer.toString('utf8').trim()

    if (!text) {
        if (status >= 400) {
            throw new ApiError(httpMessage(status), {
                code: `HTTP_${status}`,
                status
            })
        }

        throw new ApiError('Respon API kosong.', {
            code: 'EMPTY_RESPONSE',
            status
        })
    }

    let json

    try {
        json = JSON.parse(text)
    } catch {
        if (status >= 400) {
            throw new ApiError(httpMessage(status), {
                code: `HTTP_${status}`,
                status,
                detail: truncate(text, 200)
            })
        }

        const looksLikeHtml = /^\s*(?:<!doctype\s+html|<html\b|<head\b|<body\b)/i.test(text)

        throw new ApiError(
            looksLikeHtml
                ? `Endpoint ${label} mengembalikan HTML, bukan JSON atau file media.`
                : 'Respon API bukan JSON yang valid.',
            {
                code: looksLikeHtml ? 'HTML_RESPONSE' : 'INVALID_JSON',
                status,
                detail: truncate(text, 200)
            }
        )
    }

    if (status >= 400) {
        throw new ApiError(httpMessage(status, json), {
            code: `HTTP_${status}`,
            status,
            detail: json
        })
    }

    if (isErrorEnvelope(json)) {
        throw new ApiError(envelopeMessage(json), {
            code: 'API_ERROR',
            status,
            detail: json
        })
    }

    if (json === null || (typeof json === 'object' && !Object.keys(json).length)) {
        throw new ApiError('Respon API kosong.', {
            code: 'EMPTY_RESPONSE',
            status
        })
    }

    return json
}

function toApiError(err) {
    if (err instanceof ApiError) return err

    const msg = String(err?.message || err)

    if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
        return new ApiError('API timeout / terlalu lama merespon. Coba lagi nanti.', {
            code: 'TIMEOUT'
        })
    }

    if (/maxContentLength|maxBodyLength/i.test(msg)) {
        return new ApiError('Ukuran respon/file melebihi batas yang diizinkan.', {
            code: 'TOO_LARGE'
        })
    }

    if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'EPIPE'].includes(err?.code)) {
        return new ApiError('Gagal terhubung ke server (masalah jaringan).', {
            code: 'NETWORK',
            detail: err.code
        })
    }

    return new ApiError(`Request gagal: ${msg}`, {
        code: 'REQUEST_FAILED'
    })
}

const isRetryable = err => err.code === 'NETWORK' || [502, 503, 504].includes(err.status)

export async function sakuraRequest(endpoint, params = {}, opts = {}) {
    const {
        timeout = config.timeouts?.api ?? 30000,
        retries = 0,
        maxBytes = 25 * MB,
        apikey: rawKey = '',
        baseUrl: rawBase = ''
    } = opts

    const apikey = String(rawKey || config.api?.apikey || '').trim()
    const baseUrl = rawBase || config.api?.baseUrl || DEFAULT_BASE_URL

    if (!apikey) {
        throw new ApiError(
            'API key belum diisi, isi `api.apikey` di config.js (global) atau variabel `API_KEY` di file fitur ini.',
            { code: 'NO_API_KEY' }
        )
    }

    const url = `${String(baseUrl).replace(/\/+$/, '')}${endpoint}`
    const query = {}

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            query[key] = value
        }
    }

    query.apikey = apikey

    let attempt = 0

    for (;;) {
        try {
            log('GET', endpoint, attempt ? `(retry ${attempt})` : '')

            const res = await axios.get(url, {
                params: query,
                timeout,
                responseType: 'arraybuffer',
                maxContentLength: maxBytes,
                maxBodyLength: maxBytes,
                validateStatus: () => true,
                headers: {
                    Accept: 'application/json, video/*, audio/*, image/*, */*',
                    'User-Agent': USER_AGENT
                }
            })

            return parseResponse(res, endpoint)
        } catch (err) {
            const apiErr = toApiError(err)

            if (attempt < retries && isRetryable(apiErr)) {
                attempt++
                logError(`${endpoint} gagal (${apiErr.code}), mengulang...`)
                await sleep(800 * attempt)
                continue
            }

            logError(`${endpoint} gagal [${apiErr.code}]: ${apiErr.message}`)
            throw apiErr
        }
    }
}

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|127\.|10\.|0\.0\.0\.0|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:)/i

export function assertPublicHttpUrl(url) {
    let parsed

    try {
        parsed = new URL(String(url))
    } catch {
        throw new ApiError('URL tidak valid.', { code: 'INVALID_URL' })
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ApiError('URL harus diawali http:// atau https://', {
            code: 'INVALID_URL'
        })
    }

    if (PRIVATE_HOST.test(parsed.hostname)) {
        throw new ApiError('URL mengarah ke alamat internal dan diblokir', {
            code: 'INVALID_URL'
        })
    }

    return parsed.href
}

function looksLikeHtml(buffer) {
    const sample = Buffer.from(buffer)
        .toString('utf8', 0, Math.min(buffer.length, 2048))
        .replace(/^\uFEFF/, '')
        .trimStart()

    return /^\s*(?:<!doctype\s+html|<html\b|<head\b|<body\b)/i.test(sample)
}

function isHtmlMime(mime) {
    return /^(text\/html|application\/xhtml\+xml)$/i.test(String(mime || '').split(';')[0].trim())
}

export async function downloadBuffer(url, opts = {}) {
    const {
        maxBytes = (config.limits?.maxDownloadMB ?? 100) * MB,
        timeout = config.timeouts?.download ?? 120000,
        headers = {}
    } = opts

    const safeUrl = assertPublicHttpUrl(url)

    try {
        const head = await axios.head(safeUrl, {
            timeout: 10000,
            validateStatus: () => true,
            maxRedirects: 5,
            headers: {
                'User-Agent': USER_AGENT,
                ...headers
            }
        })

        const length = Number(head?.headers?.['content-length'])

        if (length > maxBytes) {
            throw new ApiError(
                `File terlalu besar (${formatBytes(length)}, batas ${formatBytes(maxBytes)}).`,
                { code: 'TOO_LARGE' }
            )
        }
    } catch (err) {
        if (err instanceof ApiError) throw err
    }

    let res

    try {
        res = await axios.get(safeUrl, {
            responseType: 'arraybuffer',
            timeout,
            maxContentLength: maxBytes,
            maxBodyLength: maxBytes,
            maxRedirects: 5,
            validateStatus: status => status >= 200 && status < 300,
            headers: {
                'User-Agent': USER_AGENT,
                Accept: 'video/*, audio/*, image/*, application/octet-stream, */*',
                ...headers
            }
        })
    } catch (err) {
        if (err?.response?.status) {
            throw new ApiError(`Gagal mengunduh file (HTTP ${err.response.status}).`, {
                code: `HTTP_${err.response.status}`,
                status: err.response.status
            })
        }

        const apiErr = toApiError(err)

        if (apiErr.code === 'TOO_LARGE') {
            throw new ApiError(`File terlalu besar (batas ${formatBytes(maxBytes)}).`, {
                code: 'TOO_LARGE'
            })
        }

        throw apiErr
    }

    const buffer = Buffer.from(res.data || [])

    if (!buffer.length) {
        throw new ApiError('File hasil download kosong.', {
            code: 'EMPTY_FILE'
        })
    }

    const headerMime = String(res.headers?.['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase()

    if (isHtmlMime(headerMime) || looksLikeHtml(buffer)) {
        throw new ApiError(
            'URL download mengembalikan halaman HTML, bukan file media. Periksa URL hasil scraper/API.',
            {
                code: 'INVALID_MEDIA',
                detail: {
                    contentType: headerMime,
                    url: safeUrl
                }
            }
        )
    }

    const detected = await fileTypeFromBuffer(buffer).catch(() => null)
    const mime = detected?.mime || headerMime || 'application/octet-stream'

    if (isHtmlMime(mime)) {
        throw new ApiError('File yang diterima adalah HTML, bukan media.', {
            code: 'INVALID_MEDIA',
            detail: { contentType: mime }
        })
    }

    return {
        buffer,
        size: buffer.length,
        mime,
        ext: detected?.ext || '',
        detected: !!detected
    }
}

export function collectUrls(node, keys = [], parent = null, out = [], depth = 0) {
    if (node === null || node === undefined || depth > 8) return out

    if (typeof node === 'string') {
        const value = node.trim()

        if (/^https?:\/\/\S+$/i.test(value)) {
            out.push({ url: value, keys, parent })
        }

        return out
    }

    if (Array.isArray(node)) {
        node.forEach((item, i) => {
            collectUrls(item, [...keys, String(i)], parent, out, depth + 1)
        })

        return out
    }

    if (typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
            collectUrls(value, [...keys, key], node, out, depth + 1)
        }
    }

    return out
}

const PREFER_KEYS = /(result|output|url|download|link|image|video|file|hd|upscal)/i
const AVOID_KEYS = /(thumb|thumbnail|preview|cover|poster|avatar|icon|logo|source|original|input)/i

export function pickResultUrl(data, { exclude = [] } = {}) {
    const skip = new Set(exclude)

    const scored = collectUrls(data)
        .filter(item => !skip.has(item.url))
        .map(item => {
            const keyPath = item.keys.join('.')
            let score = 0

            if (PREFER_KEYS.test(keyPath)) score += 2
            if (AVOID_KEYS.test(keyPath)) score -= 3

            return {
                url: item.url,
                score
            }
        })
        .sort((a, b) => b.score - a.score)

    return scored[0]?.url || null
}

export function firstString(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim()
        if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    }

    return ''
}

export function describeResult(data, max = 1500) {
    if (data === null || data === undefined) return ''
    if (typeof data === 'string') return truncate(data, max)

    const root = data.result ?? data.data ?? data.message ?? data

    if (typeof root === 'string') return truncate(root, max)

    return truncate(JSON.stringify(root, null, 2), max)
}