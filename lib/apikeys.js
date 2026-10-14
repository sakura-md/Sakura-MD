/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Pemindai status API key per-file (hanya membaca teks file, tidak pernah menampilkan isi key).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const KEY_RE = /^\s*const\s+(API_KEY|TENOR_KEY)\s*=\s*(['"`])(.*?)\2/m

function walk(dir, out = []) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.name === 'node_modules' || item.name === 'session' || item.name.startsWith('.')) continue
        const full = path.join(dir, item.name)
        if (item.isDirectory()) walk(full, out)
        else if (item.name.endsWith('.js')) out.push(full)
    }
    return out
}

// Return [{ file: 'plugins/tools/hd.js', variable: 'API_KEY', filled: true|false }]
export function scanApiKeys() {
    const result = []
    for (const file of [...walk(path.join(root, 'lib')), ...walk(path.join(root, 'plugins'))]) {
        let src = ''
        try { src = fs.readFileSync(file, 'utf8') } catch { continue }
        const m = src.match(KEY_RE)
        if (!m) continue
        result.push({ file: path.relative(root, file).replace(/\\/g, '/'), variable: m[1], filled: m[3].trim().length > 0 })
    }
    return result.sort((a, b) => a.file.localeCompare(b.file))
}

export function apiKeySummary() {
    const list = scanApiKeys()
    const filled = list.filter(x => x.filled).length
    return { list, total: list.length, filled, empty: list.length - filled }
}