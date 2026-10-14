/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { fileURLToPath } from 'url'
import { RESTART_EXIT_CODE } from './supervisor.js'
import { flushAll } from './db.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

// Plugin sudah hot-reload sendiri (handler.js), jadi tidak dipantau di sini.
// Tambahkan 'plugins' ke `watch` di config.js kalau mau plugin juga memicu restart.
const DEFAULTS = {
    enabled: true,
    watch: ['index.js', 'handler.js', 'config.js', 'package.json', 'lib'],
    extensions: ['.js', '.mjs', '.cjs'],
    interval: 2000, // seberapa sering cek perubahan (ms)
    settle: 2000,   // tunggu file berhenti berubah dulu (ms), mis. saat upload/ekstrak zip
    delay: 1000     // jeda sebelum proses keluar supaya sesi sempat tersimpan (ms)
}

let timer = null
let restarting = false

const say = text => console.log(`[AUTO-RESTART] ${text}`)

function snapshot(options) {
    const files = new Map()

    const add = file => {
        try {
            const stat = fs.statSync(file)
            files.set(file, `${stat.mtimeMs}:${stat.size}`)
        } catch {}
    }

    const walk = dir => {
        let items = []

        try {
            items = fs.readdirSync(dir, { withFileTypes: true })
        } catch {
            return
        }

        for (const item of items) {
            if (item.name === 'node_modules' || item.name.startsWith('.')) continue

            const full = path.join(dir, item.name)

            if (item.isDirectory()) walk(full)
            else if (options.extensions.includes(path.extname(item.name))) add(full)
        }
    }

    for (const entry of options.watch) {
        const full = path.join(root, entry)

        try {
            if (fs.statSync(full).isDirectory()) walk(full)
            else add(full)
        } catch {}
    }

    return files
}

function diff(before, after) {
    const changed = []

    for (const [file, sig] of after) {
        if (before.get(file) !== sig) changed.push(file)
    }

    for (const file of before.keys()) {
        if (!after.has(file)) changed.push(file)
    }

    return changed
}

// Cek sintaks dulu: file rusak tidak boleh membuat bot mati karena restart.
function checkFile(file) {
    return new Promise(resolve => {
        if (!fs.existsSync(file)) return resolve(null) // file dihapus: tidak ada yang dicek

        if (file.endsWith('.json')) {
            try {
                JSON.parse(fs.readFileSync(file, 'utf8'))
                return resolve(null)
            } catch (error) {
                return resolve(error.message)
            }
        }

        execFile(
            process.execPath,
            ['--check', file],
            { timeout: 15000 },
            (error, _stdout, stderr) => {
                if (!error) return resolve(null)

                const line = String(stderr || error.message)
                    .split('\n')
                    .find(l => /Error/.test(l))

                resolve((line || error.message).trim())
            }
        )
    })
}

export function requestRestart(reason = 'diminta', delay = DEFAULTS.delay) {
    if (restarting) return false

    restarting = true
    if (timer) clearInterval(timer)

    say(`Restart: ${reason}`)

    if (process.env.SAKURA_CHILD !== '1') {
        say('Bot tidak berjalan lewat supervisor; pastikan pm2/panel menyalakan ulang proses ini.')
    }

    try {
        flushAll()
    } catch {}

    // Beri waktu singkat agar creds/sesi dan database selesai ditulis.
    setTimeout(() => process.exit(RESTART_EXIT_CODE), delay)

    return true
}

export function startAutoRestart(userOptions = {}) {
    const options = { ...DEFAULTS, ...userOptions }

    if (!options.enabled) {
        say('Nonaktif (config.autoRestart.enabled = false).')
        return null
    }

    if (timer) clearInterval(timer)

    let known = snapshot(options)
    let pending = new Set()
    let lastChange = 0
    let checking = false

    timer = setInterval(async () => {
        if (restarting || checking) return

        const now = snapshot(options)
        const changed = diff(known, now)
        known = now

        if (changed.length) {
            changed.forEach(file => pending.add(file))
            lastChange = Date.now()
            return
        }

        if (!pending.size || Date.now() - lastChange < options.settle) return

        checking = true

        const files = [...pending]
        pending = new Set()

        try {
            for (const file of files) {
                const problem = await checkFile(file)

                if (problem) {
                    console.error(
                        `[AUTO-RESTART] ${path.relative(root, file)} bermasalah, restart dibatalkan (bot tetap jalan pakai kode lama):\n${problem}`
                    )
                    return
                }
            }

            const names = files.map(file => path.relative(root, file))

            requestRestart(
                `file berubah (${names.slice(0, 3).join(', ')}${names.length > 3 ? `, +${names.length - 3} lainnya` : ''})`,
                options.delay
            )
        } finally {
            checking = false
        }
    }, options.interval)

    timer.unref?.()

    say(`Aktif — memantau ${options.watch.join(', ')} (${known.size} file).`)

    return timer
}
