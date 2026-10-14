/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// DeepAI Chat (mode ai-code). Daftar model diambil dari halaman chat, model "locked" dilewati.
import crypto from 'node:crypto'
import { getStore } from '../cache.js'
import { ApiError } from '../api.js'

const PAGE = 'https://deepai.org/chat/ai-code'
const API = 'https://api.deepai.org/hacking_is_a_serious_crime'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex')
const cache = getStore('deepai-models', 15 * 60 * 1000, 2)

function apiKey() {
    const r = String(Math.round(Math.random() * 100000000000))
    const inner = UA + md5(UA + md5(UA + r + 'hackers_become_a_little_stinkier_every_time_they_hack'))
    return `tryit-${r}-${md5(inner)}`
}

function extractArray(html, name) {
    const m = html.match(new RegExp(`const\\s+${name}=\\[([^\\]]*)\\]`))
    if (!m) return []
    try { return JSON.parse(`[${m[1]}]`) } catch { return [] }
}

export async function getModels() {
    const hit = cache.get('models')
    if (hit) return hit
    const res = await fetch(PAGE, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new ApiError(`DeepAI tidak bisa dijangkau (HTTP ${res.status}).`, { code: 'DEEPAI_PAGE' })
    const html = await res.text()
    const all = [...extractArray(html, 'baseChatModes'), ...extractArray(html, 'additionalModels')]
    const models = all.filter(m => m?.value && !m.locked).map(m => ({ id: m.value, name: m.label || m.value }))
    if (!models.length) throw new ApiError('Tidak ada model DeepAI yang bisa dipakai saat ini.', { code: 'DEEPAI_NO_MODEL' })
    cache.set('models', models)
    return models
}

function cleanAnswer(raw) {
    let out = raw.includes('\u001C') ? raw.split('\u001C')[0] : raw
    const s = out.indexOf('\x1dTHINKING_START')
    const e = out.indexOf('\x1dTHINKING_END')
    if (s !== -1 && e !== -1) out = out.slice(0, s) + out.slice(e + '\x1dTHINKING_END'.length)
    return out.trim()
}

const uuid = () => crypto.randomUUID()

export async function askDeepAI(prompt, { model, history = [] } = {}) {
    const models = await getModels()
    const picked = model ? models.find(m => m.id === model) : models[0]
    if (!picked) throw new ApiError(`Model "${model}" tidak ditemukan / tidak bisa dipakai.`, { code: 'DEEPAI_MODEL' })

    const fd = new FormData()
    fd.append('model', picked.id)
    fd.append('chatHistory', JSON.stringify([...history, { role: 'user', content: prompt }]))
    fd.append('chat_style', 'ai-code')
    fd.append('enabled_tools', JSON.stringify(['image_generator', 'image_editor']))
    fd.append('hacker_is_stinky', 'very_stinky')
    fd.append('memory_enabled', 'false')
    fd.append('sensitivity_request_id', uuid())
    fd.append('session_uuid', uuid())
    fd.append('thinking_support', '1')
    fd.append('attachment_uuids', '[]')

    const res = await fetch(API, {
        method: 'POST',
        headers: { 'api-key': apiKey(), 'user-agent': UA, origin: 'https://deepai.org', referer: PAGE, accept: '*/*' },
        body: fd,
        signal: AbortSignal.timeout(90000)
    })
    if (!res.ok) throw new ApiError(`DeepAI menolak permintaan (HTTP ${res.status}).`, { code: `HTTP_${res.status}`, status: res.status })

    const answer = cleanAnswer(await res.text())
    if (!answer) throw new ApiError('DeepAI tidak mengembalikan jawaban.', { code: 'DEEPAI_EMPTY' })
    return { model: picked, answer }
}
