/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Pembaca respons API downloader Sakura yang bentuknya bervariasi per endpoint (murni, tanpa dependensi).
// Hasil: { title, author, thumbnail, duration, extra, media: [{ type, url, alts, quality }] }
//   kind  : 'video' | 'audio' | 'file'  -> jenis media utama endpoint itu
//   Varian kualitas (HD/SD/720p...) dalam satu video digabung jadi SATU media (kualitas terbaik <= maxQuality, sisanya alts).

const SKIP_KEYS = /(thumb|thumbnail|preview|cover|poster|avatar|icon|logo|profile|banner|author|uploader|owner|channel|html_url|homepage|repository|bugs|issues)/i
const AUDIO_EXT = /\.(mp3|m4a|aac|opus|ogg|wav|flac)(\?|#|$)/i
const IMAGE_EXT = /\.(jpe?g|png|webp)(\?|#|$)/i
const VIDEO_EXT = /\.(mp4|webm|mkv|mov)(\?|#|$)/i
const FILE_EXT = /\.(zip|rar|7z|tgz|tar|gz|apk|pdf|exe|iso|docx?|xlsx?|pptx?|txt)(\?|#|$)/i

export function collectUrls(node, keys = [], parent = null, out = [], depth = 0) {
    if (node === null || node === undefined || depth > 8) return out
    if (typeof node === 'string') {
        const value = node.trim()
        if (/^https?:\/\/\S+$/i.test(value)) out.push({ url: value, keys, parent })
        return out
    }
    if (Array.isArray(node)) {
        node.forEach((item, i) => collectUrls(item, [...keys, String(i)], parent, out, depth + 1))
        return out
    }
    if (typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) collectUrls(value, [...keys, key], node, out, depth + 1)
    }
    return out
}

export function firstString(...values) {
    for (const v of values) {
        if (typeof v === 'string' && v.trim()) return v.trim()
        if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    }
    return ''
}

function qualityScore(parent) {
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) return 0
    const q = String(parent.quality ?? parent.resolution ?? parent.label ?? parent.format ?? parent.height ?? '')
    const n = q.match(/(\d{3,4})\s*p?/)
    if (n) return Number(n[1])
    if (/hd|high/i.test(q)) return 720
    if (/sd|low/i.test(q)) return 360
    return 0
}

const qualityLabel = parent => (parent && typeof parent === 'object' && !Array.isArray(parent)
    ? firstString(parent.quality, parent.resolution, parent.label) : '')

function classify(item, kind) {
    const path = item.keys.join('.')
    if (SKIP_KEYS.test(path)) return null
    const u = item.url
    if (/\.m3u8(\?|$)/i.test(u)) return null // HLS tidak bisa dikirim sebagai file
    let type
    if (AUDIO_EXT.test(u)) type = 'audio'
    else if (IMAGE_EXT.test(u)) type = 'image'
    else if (VIDEO_EXT.test(u)) type = 'video'
    else if (FILE_EXT.test(u)) type = 'file'
    else if (/audio|mp3|music|song|track/i.test(path)) type = 'audio'
    else if (/image|photo|pic|img/i.test(path)) type = 'image'
    else type = kind
    return { ...item, type }
}

const scalar = v => {
    if (v === null || v === undefined) return ''
    if (Array.isArray(v)) return v.map(scalar).filter(Boolean).join(', ')
    if (typeof v === 'object') return firstString(v.name, v.spdx_id, v.key, v.text)
    return String(v).trim()
}

// Baris info tambahan untuk caption (stars repo, versi package, dll). mapping: [[label, [keyAlternatif]]]
export function infoLines(o, mapping) {
    if (!o || typeof o !== 'object') return []
    const sources = [o, o.repo, o.info, o.package, o.data, o.metadata].filter(x => x && typeof x === 'object')
    const lines = []
    for (const [label, keys] of mapping) {
        let value = ''
        for (const src of sources) {
            for (const k of keys) {
                value = scalar(src[k])
                if (value) break
            }
            if (value) break
        }
        if (value) lines.push(`${label}: ${value.slice(0, 120)}`)
    }
    return lines
}

export function extractFromApi(data, { kind = 'video', maxQuality = 720, describe = null } = {}) {
    const root = data?.result ?? data?.data ?? data
    const o = Array.isArray(root) ? root[0] : root
    const obj = o && typeof o === 'object' ? o : {}

    const title = firstString(obj.title, obj.name, obj.caption, obj.filename, obj.fileName, data?.title)
    const author = firstString(
        typeof obj.author === 'string' ? obj.author : obj.author?.name,
        obj.uploader, obj.artist, obj.channel, obj.username, obj.owner?.login
    )
    const thumbnail = firstString(obj.thumbnail, obj.thumb, obj.cover, obj.image)
    const duration = firstString(obj.duration, obj.durationText, obj.length)
    const extra = typeof describe === 'function' ? describe(obj) : []

    const cands = collectUrls(root).map(x => classify(x, kind)).filter(Boolean)
    const seenUrl = new Set()
    const unique = cands.filter(c => !seenUrl.has(c.url) && seenUrl.add(c.url))

    // File: satu link terbaik (utamakan kunci "download"), sisanya jadi cadangan.
    if (kind === 'file') {
        const score = c => {
            const p = c.keys.join('.')
            return (/download/i.test(p) ? 3 : 0) + (/direct|dlink|fast/i.test(p) ? 2 : 0) - (/stream|play/i.test(p) ? 1 : 0)
        }
        const sorted = [...unique].sort((a, b) => score(b) - score(a))
        if (!sorted.length) return { title, author, thumbnail, duration, extra, media: [] }
        return { title, author, thumbnail, duration, extra, media: [{ type: sorted[0].type, url: sorted[0].url, alts: sorted.slice(1, 3).map(c => c.url) }] }
    }

    // Kelompokkan varian kualitas dari array yang sama menjadi satu media.
    const groups = new Map()
    for (const c of unique) {
        const hasQ = qualityScore(c.parent) > 0 || (c.parent && typeof c.parent === 'object' && 'quality' in c.parent)
        const gk = hasQ ? `${c.type}|${c.keys.slice(0, -2).join('.')}` : `${c.type}|${c.keys.join('.')}`
        if (!groups.has(gk)) groups.set(gk, [])
        groups.get(gk).push(c)
    }
    let media = [...groups.values()].map(list => {
        const scored = list.map(c => ({ c, q: qualityScore(c.parent) }))
        const within = scored.filter(s => !maxQuality || !s.q || s.q <= maxQuality)
        const pool = (within.length ? within : scored).sort((a, b) => b.q - a.q)
        const rest = scored.filter(s => s !== pool[0]).sort((a, b) => Math.abs(a.q - pool[0].q) - Math.abs(b.q - pool[0].q))
        return { type: pool[0].c.type, url: pool[0].c.url, alts: rest.slice(0, 2).map(s => s.c.url), quality: qualityLabel(pool[0].c.parent) }
    })

    // Ada video -> buang link audio-only (mis. MP3 pendamping Facebook). Mode audio sebaliknya.
    if (kind === 'video' && media.some(m => m.type === 'video')) media = media.filter(m => m.type !== 'audio')
    if (kind === 'audio' && media.some(m => m.type === 'audio')) media = media.filter(m => m.type === 'audio')
    return { title, author, thumbnail, duration, extra, media }
}
