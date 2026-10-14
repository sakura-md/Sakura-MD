/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

// Request HTTP lewat proxies.txt dengan rotasi otomatis.
// - expect: 'json' -> respon HARUS JSON valid; kalau yang datang HTML (Cloudflare / captcha / error)
//   proxy itu dianggap gagal dan request diulang lewat proxy berikutnya.
// - expect: 'html' -> respon berupa teks/HTML.
// - accept(data, status): kembalikan true kalau respon boleh dipakai, false untuk coba proxy lain,
//   atau lempar Error dengan .fatal = true untuk berhenti (mis. akun memang tidak ada).

import axios from 'axios'
import { getProxyUrl, makeProxyAgent, markProxyBad, markProxyGood, proxyCount, maskProxy } from './proxy.js'

const BLOCK_STATUS = new Set([402, 403, 407, 429, 451, 502, 503, 520, 521, 522, 523, 524])
const looksBlocked = (text = '') => /just a moment|cf-chl|attention required|access denied|captcha|cloudflare/i.test(String(text).slice(0, 4000))

export const fatal = (message, extra = {}) => Object.assign(new Error(message), { fatal: true, ...extra })

export async function proxyRequest({
    url,
    method = 'get',
    params,
    form,
    json,
    headers = {},
    timeout = 15000,
    tries = 5,
    expect = 'json',
    accept
}) {
    const hasProxy = proxyCount() > 0
    const total = hasProxy ? Math.max(1, Math.min(tries, proxyCount())) : 1
    const errors = []

    for (let i = 0; i < total; i++) {
        const proxy = hasProxy ? getProxyUrl() : null
        const via = proxy ? maskProxy(proxy) : 'direct'
        const ctrl = new AbortController()
        const hard = setTimeout(() => ctrl.abort(), timeout + 5000)

        try {
            const res = await axios.request({
                url,
                method,
                params,
                data: form ? new URLSearchParams(form).toString() : json,
                headers: {
                    ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
                    ...(expect === 'json' ? { Accept: 'application/json, text/plain, */*' } : {}),
                    ...headers
                },
                timeout,
                signal: ctrl.signal,
                responseType: 'text',
                transformResponse: [d => d],
                validateStatus: () => true,
                maxRedirects: 5,
                proxy: false,
                ...(proxy ? { httpsAgent: makeProxyAgent(proxy) } : {})
            })

            const raw = typeof res.data === 'string' ? res.data : String(res.data ?? '')
            let data = raw

            if (expect === 'json') {
                try {
                    data = JSON.parse(raw)
                } catch {
                    if (proxy && (BLOCK_STATUS.has(res.status) || looksBlocked(raw))) markProxyBad(proxy)
                    errors.push(`${via}: bukan JSON (HTTP ${res.status})${looksBlocked(raw) ? ' / diblokir Cloudflare' : ''}`)
                    continue
                }
            } else {
                if (!raw) { errors.push(`${via}: respon kosong (HTTP ${res.status})`); continue }
                if (looksBlocked(raw) && res.status !== 200) {
                    if (proxy) markProxyBad(proxy)
                    errors.push(`${via}: halaman blokir (HTTP ${res.status})`)
                    continue
                }
            }

            if (BLOCK_STATUS.has(res.status) && expect !== 'json') {
                if (proxy) markProxyBad(proxy)
                errors.push(`${via}: HTTP ${res.status}`)
                continue
            }

            if (accept && !accept(data, res.status)) {
                errors.push(`${via}: respon tidak valid (HTTP ${res.status})`)
                continue
            }

            markProxyGood(proxy)
            return { data, status: res.status, proxy: via }
        } catch (e) {
            if (e?.fatal) throw e
            if (proxy) markProxyBad(proxy)
            const why = ctrl.signal.aborted ? 'timeout' : (e?.code || e?.message || String(e))
            errors.push(`${via}: ${why}`)
        } finally {
            clearTimeout(hard)
        }
    }

    throw new Error(errors.slice(-3).join(' | ') || 'request gagal')
}
