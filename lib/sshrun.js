/*
  Helper SSH untuk plugin installer (installpanel / setupwings / uninstallpanel).
  Script .sh di-upload ke VPS target, dijalankan di background (setsid + nohup),
  lalu lognya di-poll. Jadi kalau bot restart / koneksi putus, instalasi tetap jalan.
*/
import { Client } from 'ssh2'
import fs from 'node:fs'
import crypto from 'node:crypto'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Nilai yang dimasukkan ke SQL / shell harus aman
export const SAFE = /^[A-Za-z0-9._@%+=:,-]+$/
export const isSafe = v => typeof v === 'string' && v.length > 0 && v.length <= 128 && SAFE.test(v)

export function parseTarget(raw = '') {
    // "1.2.3.4" atau "1.2.3.4:2222"
    const m = String(raw).trim().match(/^([A-Za-z0-9.-]+)(?::(\d{1,5}))?$/)
    if (!m) return null
    return { host: m[1], port: m[2] ? Number(m[2]) : 22 }
}

export function randomPass(len = 20) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    return Array.from(crypto.randomBytes(len), b => chars[b % chars.length]).join('')
}

// Isi {{KEY}} di template script
export function renderTemplate(file, vars = {}) {
    let text = fs.readFileSync(file, 'utf8')
    for (const [k, v] of Object.entries(vars)) {
        text = text.split(`{{${k}}}`).join(String(v))
    }
    const left = text.match(/\{\{[A-Z0-9_]+\}\}/g)
    if (left) throw new Error(`Placeholder belum terisi: ${[...new Set(left)].join(', ')}`)
    return text
}

function connect({ host, port, username = 'root', password }) {
    return new Promise((resolve, reject) => {
        const c = new Client()
        const timer = setTimeout(() => { c.destroy(); reject(new Error('Timeout koneksi SSH (cek IP/port/firewall).')) }, 25000)
        c.on('ready', () => { clearTimeout(timer); resolve(c) })
        c.on('error', e => {
            clearTimeout(timer)
            const msg = /authentication/i.test(e.message)
                ? 'Login SSH gagal (user/password root salah, atau login password dimatikan).'
                : e.message
            reject(new Error(msg))
        })
        c.connect({ host, port, username, password, readyTimeout: 20000, keepaliveInterval: 10000, tryKeyboard: true })
        c.on('keyboard-interactive', (_n, _i, _l, _p, finish) => finish([password]))
    })
}

function exec(conn, cmd, stdin) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err)
            let out = '', errOut = ''
            stream.on('data', d => { out += d })
            stream.stderr.on('data', d => { errOut += d })
            stream.on('close', code => resolve({ code, out, err: errOut }))
            if (stdin != null) stream.end(stdin)
            else stream.end()
        })
    })
}

// Satu kali eksekusi dengan koneksi baru (dipakai untuk poll supaya tahan putus)
async function run(cfg, cmd, stdin) {
    const c = await connect(cfg)
    try { return await exec(c, cmd, stdin) } finally { c.end() }
}

export function redact(text, secrets = []) {
    let t = String(text)
    for (const s of secrets) if (s) t = t.split(s).join('••••••')
    return t
}

/**
 * Jalankan script di VPS.
 * @param cfg      { host, port, password, username? }
 * @param script   isi script bash
 * @param opts     { secrets, onStep(line), onLog(chunk), timeoutMs, okMarker }
 * @returns        { ok, code, output, marker }
 */
export async function runScript(cfg, script, opts = {}) {
    const { secrets = [], onStep, timeoutMs = 45 * 60 * 1000, okMarker } = opts
    const id = crypto.randomBytes(6).toString('hex')
    const sh = `/tmp/.sk-${id}.sh`, log = `/tmp/.sk-${id}.log`, rc = `/tmp/.sk-${id}.rc`

    const up = await run(cfg, `umask 077; cat > ${sh}`, script)
    if (up.code !== 0) throw new Error(`Gagal upload script: ${up.err || up.code}`)

    // Jalankan di background; script dihapus setelah selesai (berisi password)
    const start = `umask 077; setsid nohup bash -c '( bash ${sh} < /dev/null > ${log} 2>&1; echo $? > ${rc}; rm -f ${sh} )' >/dev/null 2>&1 &`
    const st = await run(cfg, start)
    if (st.code !== 0) throw new Error(`Gagal menjalankan script: ${st.err || st.code}`)

    let offset = 0, full = '', buf = '', failures = 0
    const t0 = Date.now()
    while (Date.now() - t0 < timeoutMs) {
        await sleep(6000)
        let r
        try {
            r = await run(cfg, `if [ -f ${log} ]; then tail -c +${offset + 1} ${log}; fi; echo; echo "@@RC@@$(cat ${rc} 2>/dev/null)"`)
            failures = 0
        } catch (e) {
            if (++failures >= 15) throw new Error(`Koneksi ke VPS terputus terus: ${e.message}`)
            continue
        }
        const idx = r.out.lastIndexOf('@@RC@@')
        const chunk = r.out.slice(0, idx)
        const rcVal = r.out.slice(idx + 6).trim()
        const bytes = Buffer.byteLength(chunk.replace(/\n$/, ''), 'utf8')
        // echo kosong di atas menambah 1 newline; abaikan kalau log kosong
        offset += bytes
        if (chunk.trim()) {
            full += chunk
            buf += chunk
            const lines = buf.split('\n'); buf = lines.pop()
            for (const line of lines) {
                if (line.startsWith('>> ') && onStep) {
                    try { await onStep(redact(line, secrets)) } catch {}
                }
            }
        }
        if (rcVal !== '') {
            const code = Number(rcVal)
            run(cfg, `rm -f ${log} ${rc} ${sh}`).catch(() => {})
            const output = redact(full, secrets)
            const marker = okMarker ? (output.match(new RegExp(`${okMarker}[^\\n]*`)) || [])[0] : undefined
            return { ok: code === 0 && (!okMarker || !!marker), code, output, marker }
        }
    }
    throw new Error('Timeout: instalasi melebihi 45 menit. Cek VPS manual (log: ' + log + ').')
}
