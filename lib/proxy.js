/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

// Proxy dari proxies.txt (round-robin).
// Format baris yang didukung:
//   http://user:pass@host:port   |   user:pass@host:port
//   host:port                    |   host:port:user:pass
//
// PENTING: opsi `proxy` bawaan axios TIDAK membuat tunnel CONNECT untuk target HTTPS,
// jadi request ke tiktok.com / tikwm.com lewat proxy gagal / timeout.
// Di sini dipakai agent tunnel sendiri (tanpa dependency tambahan).

import fs from 'node:fs'
import net from 'node:net'
import http from 'node:http'
import https from 'node:https'
import tls from 'node:tls'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROXY_FILE = path.resolve(__dirname, '../proxies.txt')
const BAD_MS = 2 * 60 * 1000
const CONNECT_TIMEOUT = 12000

let proxies = []
let currentIndex = 0
const bad = new Map()      // proxyUrl -> waktu boleh dipakai lagi
const agents = new Map()   // proxyUrl -> agent

function normalizeLine(line) {
    let s = String(line || '').trim()
    if (!s || s.startsWith('#')) return null
    if (!/^https?:\/\//i.test(s)) {
        if (s.includes('@')) s = `http://${s}`
        else {
            const p = s.split(':')
            if (p.length === 2) s = `http://${p[0]}:${p[1]}`
            else if (p.length === 4) s = `http://${encodeURIComponent(p[2])}:${encodeURIComponent(p[3])}@${p[0]}:${p[1]}`
            else return null
        }
    }
    try {
        const u = new URL(s)
        if (!['http:', 'https:'].includes(u.protocol) || !u.hostname || !u.port) return null
        return s
    } catch {
        return null
    }
}

export function reloadProxies() {
    try {
        proxies = [...new Set(
            fs.readFileSync(PROXY_FILE, 'utf8')
                .split(/\r?\n/)
                .map(normalizeLine)
                .filter(Boolean)
        )]
        // mulai dari posisi acak supaya setelah restart tidak selalu proxy pertama
        currentIndex = proxies.length ? Math.floor(Math.random() * proxies.length) : 0
        bad.clear()
        agents.clear()
        console.log(`[PROXY] ${proxies.length} proxy dimuat`)
    } catch (error) {
        proxies = []
        currentIndex = 0
        console.error('[PROXY] Gagal membaca proxies.txt:', error.message)
    }
    return proxies.length
}

export const proxyCount = () => proxies.length

export const maskProxy = (raw = '') => {
    try { const u = new URL(raw); return `${u.hostname}:${u.port}` } catch { return 'direct' }
}

export function getProxyUrl() {
    if (!proxies.length) return null
    const now = Date.now()
    for (let i = 0; i < proxies.length; i++) {
        const p = proxies[currentIndex % proxies.length]
        currentIndex++
        if ((bad.get(p) || 0) <= now) return p
    }
    // semua proxy sedang "istirahat" -> tetap pakai yang berikutnya
    const p = proxies[currentIndex % proxies.length]
    currentIndex++
    return p
}

export const markProxyBad = raw => { if (raw) bad.set(raw, Date.now() + BAD_MS) }
export const markProxyGood = raw => { if (raw) bad.delete(raw) }

// Agent HTTPS yang lewat proxy HTTP lewat tunnel CONNECT.
class ProxyTunnelAgent extends https.Agent {
    constructor(proxyUrl) {
        super({ keepAlive: false })
        this.proxyUrl = new URL(proxyUrl)
    }

    createConnection(options, callback) {
        const p = this.proxyUrl
        const host = options.hostname || options.host
        const port = options.port || 443
        const headers = { Host: `${host}:${port}` }
        if (p.username) {
            const cred = `${decodeURIComponent(p.username)}:${decodeURIComponent(p.password || '')}`
            headers['Proxy-Authorization'] = `Basic ${Buffer.from(cred).toString('base64')}`
        }

        let done = false
        const finish = (err, sock) => {
            if (done) return
            done = true
            clearTimeout(timer)
            callback(err, sock)
        }

        const req = (p.protocol === 'https:' ? https : http).request({
            host: p.hostname,
            port: Number(p.port),
            method: 'CONNECT',
            path: `${host}:${port}`,
            headers
        })
        const timer = setTimeout(() => req.destroy(new Error('Proxy timeout')), CONNECT_TIMEOUT)

        req.once('connect', (res, socket) => {
            if (res.statusCode !== 200) {
                socket.destroy()
                return finish(new Error(`Proxy CONNECT ${res.statusCode}`))
            }
            const secure = tls.connect({
                socket,
                servername: options.servername || (net.isIP(host) ? undefined : host),
                ALPNProtocols: ['http/1.1'],
                rejectUnauthorized: options.rejectUnauthorized
            })
            secure.once('secureConnect', () => finish(null, secure))
            secure.once('error', err => finish(err))
        })
        req.once('error', err => finish(err))
        req.end()
    }
}

export function makeProxyAgent(raw) {
    let a = agents.get(raw)
    if (!a) { a = new ProxyTunnelAgent(raw); agents.set(raw, a) }
    return a
}

// Untuk dipakai langsung di axios: ...getProxyConfig()
export function getProxyConfig() {
    const raw = getProxyUrl()
    if (!raw) return {}
    return { proxy: false, httpsAgent: makeProxyAgent(raw) }
}

reloadProxies()
