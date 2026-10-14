/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import axios from 'axios'
import { assertPublicHttpUrl } from './api.js'

const SHORTENERS = /(^|\.)(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy|s\.id|shorturl\.at|ow\.ly|goo\.gl|linktr\.ee)$/i
const SUSPICIOUS_TLD = /\.(zip|mov|xyz|top|click|country|gq|tk|ml|cf)$/i

// Periksa URL: ikuti redirect manual (maks 5 hop, tiap hop divalidasi anti-SSRF), tanpa mengunduh isi halaman.
// Hasilnya HEURISTIK — bukan jaminan bahwa link aman.
export async function inspectUrl(input) {
    const start = assertPublicHttpUrl(input)
    const hops = []
    let current = start
    let final = null
    const t0 = Date.now()
    for (let i = 0; i < 6; i++) {
        const res = await axios.get(current, {
            maxRedirects: 0, timeout: 10000, validateStatus: () => true, responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakuraMD-linkcheck)' }
        })
        res.data.destroy()
        hops.push({ url: current, status: res.status })
        const loc = res.headers?.location
        if (res.status >= 300 && res.status < 400 && loc) {
            current = assertPublicHttpUrl(new URL(loc, current).href)
            continue
        }
        final = { url: current, status: res.status, type: String(res.headers?.['content-type'] || '').split(';')[0], length: Number(res.headers?.['content-length']) || null }
        break
    }
    const host = new URL(final?.url || current).hostname
    const notes = []
    if (new URL(start).protocol === 'http:') notes.push('Memakai HTTP (tidak terenkripsi)')
    if (SHORTENERS.test(new URL(start).hostname)) notes.push('Link pendek (tujuan asli disembunyikan)')
    if (SUSPICIOUS_TLD.test(host)) notes.push(`TLD sering disalahgunakan (${host.split('.').pop()})`)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) notes.push('Memakai alamat IP langsung, bukan domain')
    if (host.startsWith('xn--') || host.includes('.xn--')) notes.push('Domain punycode (bisa meniru domain lain)')
    if (hops.length > 3) notes.push(`Banyak redirect (${hops.length - 1})`)
    if (!final) notes.push('Redirect terlalu banyak / tidak selesai')
    return { start, hops, final, host, notes, ms: Date.now() - t0 }
}