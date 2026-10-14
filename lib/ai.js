/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import axios from 'axios'
import config from '../config.js'
import { ApiError, firstString, truncate } from './api.js'
import { getStore } from './cache.js'
import logger from './logger.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur AI — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
// Provider: Clouvia Router (OpenAI v1 compatible). Buat key di https://router.clouvia.id/app/keys
const API_KEY = config.api.ai.apikey
const BASE_URL = config.api.ai.baseUrl

// Nama model diatur di config.js -> api.ai (lihat daftar model & tarif di https://router.clouvia.id/rates)
const DEFAULT_MODEL = 'coding-high'
const DEFAULT_VISION_MODEL = 'gemini-3.8-flash-high'

const cfg = () => config.api?.ai || {}
const modelName = () => String(cfg().model || DEFAULT_MODEL).trim()
const visionModelName = () => String(cfg().visionModel || DEFAULT_VISION_MODEL).trim()
const timeoutMs = () => config.timeouts?.api ?? 30000

export const aiConfigured = () => API_KEY.trim().length > 0

const NOT_CONFIGURED = 'API AI belum dikonfigurasi. Owner perlu mengisi `API_KEY` Clouvia di lib/ai.js.'
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Bersihkan jawaban: buang blok <think> dari model reasoning, ambil teks dari format string/array
function pickText(data) {
    const msg = data?.choices?.[0]?.message
    let content = msg?.content
    if (Array.isArray(content)) content = content.map(p => (typeof p === 'string' ? p : p?.text || '')).join('')
    if (typeof content !== 'string') content = firstString(content, data?.choices?.[0]?.text) || ''
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

function mapHttpError(status, body) {
    const detail = String(body?.error?.message || body?.message || body?.error || '').slice(0, 200)
    if (status === 401 || status === 403) return new ApiError('API key Clouvia ditolak (salah / dinonaktifkan / IP tidak diizinkan).', { code: 'BAD_API_KEY', status, detail })
    if (status === 402) return new ApiError('Saldo Clouvia habis. Top up di router.clouvia.id.', { code: 'NO_BALANCE', status, detail })
    if (status === 404 || (status === 400 && /model/i.test(detail))) return new ApiError(`Model tidak tersedia di Clouvia${detail ? ` (${detail})` : ''}. Cek nama model di config.js -> api.ai.model.`, { code: 'BAD_MODEL', status, detail })
    if (status === 429) return new ApiError('Terkena rate limit Clouvia, coba lagi sebentar.', { code: 'RATE_LIMIT', status, detail })
    return new ApiError(detail || `Clouvia HTTP ${status}`, { code: 'API_ERROR', status, detail })
}

// Satu panggilan chat/completions (format OpenAI v1), retry 1x untuk 5xx / timeout.
async function chat(messages, { model, timeout = timeoutMs(), maxTokens } = {}) {
    const key = API_KEY.trim()
    if (!key) throw new ApiError(NOT_CONFIGURED, { code: 'NO_AI' })

    let lastErr
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await axios.post(`${BASE_URL}/chat/completions`, {
                model,
                messages,
                max_tokens: maxTokens || cfg().maxTokens || 4096,
                temperature: 0.3,
                stream: false
            }, {
                timeout,
                validateStatus: () => true,
                headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
            })
            if (res.status >= 500 && attempt === 0) { lastErr = mapHttpError(res.status, res.data); await sleep(1200); continue }
            if (res.status >= 400) throw mapHttpError(res.status, res.data)
            const text = pickText(res.data)
            if (!text) throw new ApiError('API AI tidak mengembalikan jawaban.', { code: 'EMPTY_RESPONSE' })
            return text
        } catch (e) {
            if (e instanceof ApiError) throw e
            lastErr = new ApiError(e?.code === 'ECONNABORTED' ? 'AI terlalu lama merespons (timeout).' : `Gagal terhubung ke Clouvia: ${e?.message || e}`, { code: 'NETWORK' })
            if (attempt === 0) await sleep(1200)
        }
    }
    throw lastErr
}

export async function askAI(prompt, { system = '' } = {}) {
    const messages = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: truncate(prompt, 6000) })

    const t0 = Date.now()
    logger.ai('PERTANYAAN', prompt)
    try {
        const text = await chat(messages, { model: modelName(), timeout: 60000 })
        logger.ai('JAWABAN', text, Date.now() - t0)
        return text
    } catch (e) {
        logger.aiError('GAGAL', e?.message || e)
        throw e
    }
}

export async function askVision(imageUrl, prompt = '') {
    logger.ai('VISION', prompt || '(analisis gambar)')
    const text = await chat([{
        role: 'user',
        content: [
            { type: 'text', text: prompt || 'Jelaskan gambar ini secara rinci.' },
            { type: 'image_url', image_url: { url: imageUrl } }
        ]
    }], { model: visionModelName(), timeout: 60000 })
    logger.ai('VISION OK', text)
    return text
}

export async function askOcr(imageUrl) {
    logger.ai('OCR', 'membaca teks dari gambar')
    const text = await chat([{
        role: 'user',
        content: [
            { type: 'text', text: 'Transkripsikan SEMUA teks yang terlihat pada gambar ini apa adanya, tanpa komentar tambahan. Jika tidak ada teks, balas persis: TIDAK ADA TEKS.' },
            { type: 'image_url', image_url: { url: imageUrl } }
        ]
    }], { model: visionModelName(), timeout: 60000, maxTokens: 2000 })
    const clean = /^TIDAK ADA TEKS\.?$/i.test(text.trim()) ? '' : text
    logger.ai('OCR OK', clean || '(kosong)')
    return clean
}

// ---- Sesi percakapan (.ai on/off/reset): riwayat singkat per chat+user, kedaluwarsa 30 menit
const sessions = getStore('ai-session', 30 * 60 * 1000, 300)
const key = (m) => `${m.chat}|${m.sender}`

export const sessionOn = (m) => !!sessions.get(key(m))?.on
export function setSession(m, on) {
    const cur = sessions.get(key(m)) || { history: [] }
    sessions.set(key(m), { ...cur, on })
}
export const resetSession = (m) => sessions.set(key(m), { on: sessionOn(m), history: [] })
export const historyOf = (m) => sessions.get(key(m))?.history || []
export function pushHistory(m, q, a) {
    const cur = sessions.get(key(m)) || { on: false, history: [] }
    cur.history = [...cur.history, { q: truncate(q, 300), a: truncate(a, 400) }].slice(-5)
    sessions.set(key(m), cur)
}
export const withHistory = (m, prompt) => {
    const h = historyOf(m)
    if (!h.length) return prompt
    return `Riwayat percakapan sebelumnya:\n${h.map(x => `User: ${x.q}\nAI: ${x.a}`).join('\n')}\n\nPertanyaan baru: ${prompt}`
}