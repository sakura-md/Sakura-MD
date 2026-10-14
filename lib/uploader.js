/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../config.js'
import { ApiError } from './api.js'

// Project belum punya uploader sebelumnya, jadi ini satu-satunya uploader (dipakai .hd & .hdvid).
// Memakai fetch/FormData/Blob bawaan Node >= 18, tanpa dependency tambahan.

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value || '').trim())

async function postForm(url, form, timeout) {
    const res = await fetch(url, { method: 'POST', body: form, signal: AbortSignal.timeout(timeout) })
    const text = (await res.text()).trim()
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`)
    return text
}

const HOSTS = {
    async catbox(buffer, { filename, mime, timeout }) {
        const form = new FormData()
        form.append('reqtype', 'fileupload')
        form.append('fileToUpload', new Blob([buffer], { type: mime }), filename)
        const text = await postForm('https://catbox.moe/user/api.php', form, timeout)
        if (!isHttpUrl(text)) throw new Error(`respon tidak dikenali: ${text.slice(0, 120)}`)
        return text
    },

    async uguu(buffer, { filename, mime, timeout }) {
        const form = new FormData()
        form.append('files[]', new Blob([buffer], { type: mime }), filename)
        const text = await postForm('https://uguu.se/upload', form, timeout)
        try {
            const json = JSON.parse(text)
            const url = json?.files?.[0]?.url
            if (json?.success !== false && isHttpUrl(url)) return url
            throw new Error(`respon tidak dikenali: ${text.slice(0, 120)}`)
        } catch (e) {
            if (isHttpUrl(text)) return text
            throw e
        }
    }
}

// Upload buffer ke host sementara dan kembalikan URL publik.
export async function uploadBuffer(buffer, { filename = 'file.bin', mime = 'application/octet-stream' } = {}) {
    const timeout = config.timeouts?.upload ?? 60000
    const hosts = (config.uploader?.hosts || ['catbox', 'uguu']).filter(name => HOSTS[name])
    const errors = []

    for (const name of hosts) {
        try {
            const url = await HOSTS[name](buffer, { filename, mime, timeout })
            console.log(`[uploader] ${name} OK`)
            return { url: url.trim(), host: name }
        } catch (e) {
            const reason = e?.name === 'TimeoutError' ? 'timeout' : (e?.message || String(e))
            console.error(`[uploader] ${name} gagal: ${reason}`)
            errors.push(`${name}: ${reason}`)
        }
    }

    throw new ApiError(
        `Gagal upload media ke server sementara (${errors.join(' | ') || 'tidak ada host aktif'}).`,
        { code: 'UPLOAD_FAILED' }
    )
}