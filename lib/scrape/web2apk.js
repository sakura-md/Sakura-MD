/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Web -> APK: template WebView + patch AndroidManifest (nama & package) + ganti URL/ikon + tanda tangan.
// Butuh di server: Java JDK (java, javac, jar) dan apksigner (Android build-tools).
// Semua perintah dijalankan dengan execFile (argumen terpisah, tanpa shell) supaya input user aman.
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, mkdir, writeFile, readFile, copyFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import config from '../../config.js'
import { ApiError } from '../api.js'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, '.cache', 'web2apk')
const REPO = 'https://raw.githubusercontent.com/HaidarMahiru/web2apk-creator/main/'
const KS_PASS = config.apk?.keystorePass || 'mdmdky'

const HELPERS = ['AXmlDecoder', 'AXmlEditor', 'Edit', 'FileUtil', 'LEDataInputStream', 'LEDataOutputStream', 'StringBlock', 'StringUtils']
const ASSETS = [
    'template/NamaAplikasi.zip',
    'template/AndroidManifest.xml',
    'template/mmdfauzan.key',
    'patcher_src/ManifestPatcher.java',
    ...HELPERS.map(h => `patcher_src/com/haidar/bikinaplikasi/helper/${h}.java`)
]

const exists = (p) => access(p).then(() => true, () => false)
const exec = (file, args, opts = {}) => run(file, args, { timeout: 120000, maxBuffer: 8 * 1024 * 1024, ...opts })

// Cek tool yang dibutuhkan; kembalikan daftar yang belum ada.
export async function missingTools() {
    const need = [['java', ['-version']], ['javac', ['-version']], ['jar', ['--version']], ['apksigner', ['--version']]]
    const missing = []
    for (const [bin, args] of need) {
        try { await exec(bin, args, { timeout: 15000 }) } catch (e) { if (e?.code === 'ENOENT') missing.push(bin) }
    }
    return missing
}

let assetsReady = null
async function ensureAssets() {
    if (assetsReady) return assetsReady
    assetsReady = (async () => {
        for (const file of ASSETS) {
            const dest = join(CACHE, file)
            if (await exists(dest)) continue
            await mkdir(dirname(dest), { recursive: true })
            const res = await fetch(REPO + file, { signal: AbortSignal.timeout(60000) })
            if (!res.ok) throw new ApiError(`Gagal mengunduh komponen ${file} (HTTP ${res.status}).`, { code: 'W2A_ASSET' })
            await writeFile(dest, Buffer.from(await res.arrayBuffer()))
        }
        const out = join(CACHE, 'build_patcher')
        if (!(await exists(join(out, 'ManifestPatcher.class')))) {
            await mkdir(out, { recursive: true })
            const helpers = HELPERS.map(h => join(CACHE, `patcher_src/com/haidar/bikinaplikasi/helper/${h}.java`))
            await exec('javac', ['-d', out, join(CACHE, 'patcher_src/ManifestPatcher.java'), ...helpers])
        }
    })().catch(e => { assetsReady = null; throw e })
    return assetsReady
}

export const validPackage = (s) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(s) && s.length <= 100
export const normalizeUrl = (s) => {
    try {
        const u = new URL(String(s).trim())
        return ['http:', 'https:'].includes(u.protocol) && u.href.length <= 500 ? u.href : null
    } catch { return null }
}

// Ikon bawaan (huruf pertama nama app) kalau user tidak mengirim gambar
export const defaultIcon = (name) => {
    const letter = (String(name).trim()[0] || 'S').toUpperCase().replace(/[<>&]/g, 'S')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="40" fill="#e91e63"/><text x="96" y="130" font-size="108" font-family="sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">${letter}</text></svg>`
    return sharp(Buffer.from(svg)).png().toBuffer()
}

// Antrean: hanya satu build berjalan pada satu waktu (hemat CPU/RAM server).
let chain = Promise.resolve()
let busy = false
export const buildQueueBusy = () => busy

export function buildApk(opts) {
    const job = chain.then(() => { busy = true; return doBuild(opts) }).finally(() => { busy = false })
    chain = job.catch(() => {})
    return job
}

async function doBuild({ appName, url, packageName, icon }) {
    await ensureAssets()
    const work = await mkdtemp(join(tmpdir(), 'sakura-w2a-'))
    try {
        const tpl = join(work, 'template.apk')
        const manifestIn = join(work, 'AndroidManifest.in.xml')
        const manifestOut = join(work, 'AndroidManifest.xml')
        const ks = join(work, 'sign.key')
        const unzipped = join(work, 'apk')
        const unsigned = join(work, 'unsigned.apk')
        const signed = join(work, 'app.apk')

        await copyFile(join(CACHE, 'template/NamaAplikasi.zip'), tpl)
        await copyFile(join(CACHE, 'template/AndroidManifest.xml'), manifestIn)
        await copyFile(join(CACHE, 'template/mmdfauzan.key'), ks)

        await exec('java', ['-cp', join(CACHE, 'build_patcher'), 'ManifestPatcher', manifestIn, manifestOut, packageName, appName])

        await mkdir(unzipped, { recursive: true })
        await exec('jar', ['xf', tpl], { cwd: unzipped })
        await rm(join(unzipped, 'META-INF'), { recursive: true, force: true })

        await mkdir(join(unzipped, 'assets'), { recursive: true })
        await writeFile(join(unzipped, 'assets/ad'), url)
        await writeFile(join(unzipped, 'assets/ads'), JSON.stringify({ app_id: '', unit_id: '' }))
        await writeFile(join(unzipped, 'assets/pref'), JSON.stringify({ ptr: 1 }))
        await copyFile(manifestOut, join(unzipped, 'AndroidManifest.xml'))
        await mkdir(join(unzipped, 'res/drawable'), { recursive: true })
        await writeFile(join(unzipped, 'res/drawable/ico.png'), await sharp(icon).resize(192, 192, { fit: 'cover' }).png().toBuffer())

        await exec('jar', ['cf', unsigned, '-C', unzipped, '.'])
        await exec('apksigner', ['sign', '--ks', ks, '--ks-pass', `pass:${KS_PASS}`, '--key-pass', `pass:${KS_PASS}`, '--out', signed, unsigned])
        return await readFile(signed)
    } catch (e) {
        if (e instanceof ApiError) throw e
        if (e?.code === 'ENOENT') throw new ApiError(`Tool server belum terpasang: ${e.path || 'java/apksigner'}. Pasang JDK dan Android build-tools.`, { code: 'W2A_TOOLS' })
        const detail = String(e?.stderr || e?.message || e).split('\n').find(Boolean) || 'tidak diketahui'
        throw new ApiError(`Build APK gagal: ${detail.slice(0, 160)}`, { code: 'W2A_BUILD' })
    } finally {
        rm(work, { recursive: true, force: true }).catch(() => {})
    }
}
