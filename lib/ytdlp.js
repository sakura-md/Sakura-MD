/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Pembungkus yt-dlp OPSIONAL. Dipakai sebagai jalur cadangan terakhir oleh scraper TikTok & YouTube
// kalau semua sumber bawaan gagal. Kalau yt-dlp tidak terpasang, semuanya otomatis dilewati.
// Pasang di panel/VPS:  pip install -U yt-dlp   (atau taruh binary-nya, lalu set env YTDLP_PATH=/path/yt-dlp)
import { spawn } from 'child_process'

const BIN = process.env.YTDLP_PATH || 'yt-dlp'
let cached = null // { ok, at }

export function runYtdlp(args = [], { timeout = 45000 } = {}) {
    return new Promise((resolve, reject) => {
        let child
        try {
            child = spawn(BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        } catch (e) {
            return reject(e)
        }
        let out = ''
        let err = ''
        let done = false
        const finish = (fn, value) => {
            if (done) return
            done = true
            clearTimeout(timer)
            fn(value)
        }
        const timer = setTimeout(() => {
            try { child.kill('SIGKILL') } catch {}
            finish(reject, new Error('yt-dlp timeout'))
        }, timeout)
        child.stdout.on('data', d => { out += d; if (out.length > 8e6) { try { child.kill('SIGKILL') } catch {} } })
        child.stderr.on('data', d => { err += d; if (err.length > 20000) err = err.slice(-20000) })
        child.on('error', e => finish(reject, e))
        child.on('close', code => {
            if (code === 0) return finish(resolve, out)
            const line = err.split('\n').map(s => s.trim()).filter(Boolean).pop() || `exit code ${code}`
            finish(reject, new Error(line.slice(0, 300)))
        })
    })
}

export async function hasYtdlp() {
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.ok
    let ok = false
    try {
        await runYtdlp(['--version'], { timeout: 8000 })
        ok = true
    } catch {}
    cached = { ok, at: Date.now() }
    return ok
}