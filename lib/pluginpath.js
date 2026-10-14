/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const projectRoot = path.resolve(__dirname, '..')
export const pluginRoot = path.join(projectRoot, 'plugins')

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const MAX_DEPTH = 6

// File yang tidak boleh disentuh addplugin/delplugin.
// (Semua file di luar plugins/ sudah otomatis ditolak; daftar ini pertahanan tambahan.)
const PROTECTED_ROOT_FILES = ['config.js', 'handler.js', 'index.js', 'package.json', 'package-lock.json']
const SELF_MANAGEMENT_PLUGINS = ['plugins/owner/addplugin.js', 'plugins/owner/delplugin.js']

function realpathOfExistingAncestor(target) {
    let current = target
    for (;;) {
        try {
            return { real: fs.realpathSync(current), existing: current }
        } catch {
            const parent = path.dirname(current)
            if (parent === current) return null
            current = parent
        }
    }
}

// Validasi path plugin dari input user. Hanya file .js di dalam folder plugins/ yang diizinkan.
// Return { ok: true, abs, rel } atau { ok: false, error }.
export function resolvePluginPath(input, { mustExist = false } = {}) {
    let raw = String(input ?? '').trim().replace(/\\/g, '/')
    if (!raw) return { ok: false, error: 'Path plugin kosong.' }
    if (raw.includes('\0')) return { ok: false, error: 'Path tidak valid.' }
    if (raw.startsWith('/') || /^[A-Za-z]:/.test(raw)) return { ok: false, error: 'Path absolut tidak diizinkan. Gunakan path relatif, contoh: plugins/test/hello.js' }

    raw = raw.replace(/^\.\//, '').replace(/\/{2,}/g, '/')
    const segments = raw.split('/')

    if (segments.some(seg => seg === '..' || seg === '.')) return { ok: false, error: 'Path traversal (..) tidak diizinkan.' }
    if (segments[0] !== 'plugins') return { ok: false, error: 'Path harus diawali `plugins/`, contoh: plugins/test/hello.js' }
    if (segments.length < 2) return { ok: false, error: 'Sertakan nama file, contoh: plugins/test/hello.js' }
    if (segments.length > MAX_DEPTH) return { ok: false, error: `Folder terlalu dalam (maksimal ${MAX_DEPTH} level).` }
    if (segments.some(seg => !SEGMENT.test(seg))) return { ok: false, error: 'Nama folder/file hanya boleh huruf, angka, titik, minus, dan underscore (tidak boleh diawali titik).' }

    const fileName = segments[segments.length - 1]
    if (!fileName.endsWith('.js') || fileName === '.js') return { ok: false, error: 'Hanya file berekstensi .js yang diizinkan.' }

    const abs = path.join(projectRoot, ...segments)
    const rel = segments.join('/')

    const relToPlugins = path.relative(pluginRoot, abs)
    if (!relToPlugins || relToPlugins.startsWith('..') || path.isAbsolute(relToPlugins)) {
        return { ok: false, error: 'Path di luar folder plugins tidak diizinkan.' }
    }

    if (PROTECTED_ROOT_FILES.some(name => abs === path.join(projectRoot, name))) {
        return { ok: false, error: 'File inti project tidak boleh diubah.' }
    }

    // Cegah escape lewat symlink
    try {
        const realRoot = fs.realpathSync(pluginRoot)
        const anc = realpathOfExistingAncestor(abs)
        if (!anc) return { ok: false, error: 'Path tidak valid.' }
        const relReal = path.relative(realRoot, anc.real)
        if (relReal.startsWith('..') || path.isAbsolute(relReal)) return { ok: false, error: 'Path mengarah ke luar folder plugins (symlink).' }
        if (fs.existsSync(abs) && fs.lstatSync(abs).isSymbolicLink()) return { ok: false, error: 'Symlink tidak diizinkan.' }
    } catch {
        return { ok: false, error: 'Path tidak valid.' }
    }

    if (mustExist) {
        let stat
        try { stat = fs.statSync(abs) } catch { return { ok: false, error: `File tidak ditemukan: ${rel}` } }
        if (!stat.isFile()) return { ok: false, error: `${rel} bukan file.` }
    }

    return { ok: true, abs, rel }
}

export const isSelfManagementPlugin = (rel) => SELF_MANAGEMENT_PLUGINS.includes(rel)