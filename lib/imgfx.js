/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import sharp from 'sharp'

// Efek gambar lokal (sharp + SVG). Tanpa API eksternal. Teks memakai font sistem (sans-serif);
// jika server tidak punya font, teks bisa tampil sebagai kotak — pasang font (mis. fonts-dejavu).
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]))

// Bungkus teks per kata; kata sangat panjang dipotong. Return array baris (maks maxLines).
export function wrap(text, maxChars, maxLines = 12) {
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ')
    const lines = []
    let cur = ''
    for (let w of words) {
        while (w.length > maxChars) { if (cur) { lines.push(cur); cur = '' } lines.push(w.slice(0, maxChars)); w = w.slice(maxChars) }
        if ((cur + ' ' + w).trim().length > maxChars) { lines.push(cur); cur = w } else cur = (cur + ' ' + w).trim()
    }
    if (cur) lines.push(cur)
    return lines.slice(0, maxLines)
}

const tspans = (lines, x, lineH, anchor = 'middle', startY = 0) => lines.map((l, i) => `<tspan x="${x}" y="${startY + i * lineH}" text-anchor="${anchor}">${esc(l)}</tspan>`).join('')
const png = (svg) => sharp(Buffer.from(svg)).png().toBuffer()

export async function brat(text) {
    const t = String(text).toLowerCase().slice(0, 200)
    const size = t.length < 20 ? 190 : t.length < 60 ? 130 : 90
    const lines = wrap(t, Math.floor(1000 / (size * 0.52)), 8)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#8ace00"/><text font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#000" font-weight="500">${tspans(lines, 40, size * 1.05, 'start', size + 20)}</text></svg>`
    return sharp(Buffer.from(svg)).blur(1.6).png().toBuffer()
}

export async function quote(text, author = '') {
    const lines = wrap(text, 26, 10)
    const size = lines.length > 6 ? 46 : 60
    const y0 = 540 - ((lines.length - 1) * size * 1.3) / 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b0a1f"/><stop offset="1" stop-color="#0a0a0f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="80" y="200" font-size="220" fill="#ff8fb8" opacity=".5" font-family="Georgia, serif">“</text><text font-family="Georgia, serif" font-size="${size}" fill="#fff">${tspans(lines, 540, size * 1.3, 'middle', y0)}</text>${author ? `<text x="540" y="930" text-anchor="middle" font-size="38" fill="#ff8fb8" font-family="Arial, sans-serif">— ${esc(author.slice(0, 40))}</text>` : ''}<text x="540" y="1040" text-anchor="middle" font-size="26" fill="#ffffff" opacity=".4" font-family="Arial, sans-serif">🌸 Sakura-MD</text></svg>`
    return png(svg)
}

export async function neon(text) {
    const lines = wrap(text, 12, 4)
    const size = lines.length > 2 ? 130 : 170
    const y0 = 512 - ((lines.length - 1) * size * 1.1) / 2 + size * 0.35
    const body = tspans(lines, 512, size * 1.1, 'middle', y0)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><filter id="b1"><feGaussianBlur stdDeviation="14"/></filter><filter id="b2"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="100%" height="100%" fill="#07030a"/><g font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${size}"><text fill="#ff2e93" filter="url(#b1)">${body}</text><text fill="#ff2e93" filter="url(#b2)">${body}</text><text fill="#ffe6f2" stroke="#ff2e93" stroke-width="3">${body}</text></g></svg>`
    return png(svg)
}

export async function banner(text) {
    const lines = wrap(text, 22, 3)
    const size = lines.length > 1 ? 90 : 120
    const y0 = 250 - ((lines.length - 1) * size * 1.1) / 2 + size * 0.35
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5fa2"/><stop offset="1" stop-color="#6c2bd9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><g fill="#fff" opacity=".18"><circle cx="1350" cy="90" r="140"/><circle cx="120" cy="430" r="110"/></g><text font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${size}" fill="#fff">${tspans(lines, 750, size * 1.1, 'middle', y0)}</text></svg>`
    return png(svg)
}

export async function logo(text) {
    const t = String(text).slice(0, 14)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><radialGradient id="g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#ff9cc7"/><stop offset="1" stop-color="#b0195a"/></radialGradient></defs><rect width="100%" height="100%" fill="#120612"/><circle cx="512" cy="512" r="420" fill="url(#g)"/><circle cx="512" cy="512" r="420" fill="none" stroke="#fff" stroke-width="10" opacity=".6"/><text x="512" y="${512 + (t.length > 8 ? 30 : 50)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${t.length > 8 ? 110 : 160}" fill="#fff">${esc(t)}</text></svg>`
    return png(svg)
}

export async function certificate(name, title = 'Penghargaan Spesial') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1130"><rect width="100%" height="100%" fill="#fffaf0"/><rect x="40" y="40" width="1520" height="1050" fill="none" stroke="#b8860b" stroke-width="12"/><rect x="70" y="70" width="1460" height="990" fill="none" stroke="#b8860b" stroke-width="3"/><g font-family="Georgia, serif" text-anchor="middle" fill="#3a2a10"><text x="800" y="260" font-size="110" font-weight="bold" fill="#b8860b">SERTIFIKAT</text><text x="800" y="360" font-size="42">diberikan kepada</text><text x="800" y="540" font-size="${name.length > 22 ? 80 : 110}" font-style="italic">${esc(name.slice(0, 40))}</text><line x1="400" y1="580" x2="1200" y2="580" stroke="#b8860b" stroke-width="3"/><text x="800" y="700" font-size="46">sebagai</text><text x="800" y="790" font-size="62" font-weight="bold">${esc(title.slice(0, 50))}</text><text x="800" y="1000" font-size="30" opacity=".7">Sakura-MD • sertifikat hiburan</text></g></svg>`
    return png(svg)
}

const cover = (buf, w, h) => sharp(buf).rotate().resize(w, h, { fit: 'cover' }).jpeg({ quality: 92 }).toBuffer()

export async function wanted(buf, name = 'UNKNOWN') {
    const photo = await cover(buf, 620, 620)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1300"><rect width="100%" height="100%" fill="#e7d3a1"/><rect x="25" y="25" width="850" height="1250" fill="none" stroke="#5b3a14" stroke-width="10"/><g font-family="Georgia, serif" text-anchor="middle" fill="#3b230b"><text x="450" y="200" font-size="150" font-weight="bold">WANTED</text><text x="450" y="1000" font-size="${name.length > 14 ? 60 : 84}" font-weight="bold">${esc(name.toUpperCase().slice(0, 24))}</text><text x="450" y="1090" font-size="44">DEAD OR ALIVE</text><text x="450" y="1190" font-size="44" font-weight="bold">REWARD Rp 1.000.000.000</text></g></svg>`
    const base = await sharp(Buffer.from(svg)).png().toBuffer()
    return sharp(base).composite([{ input: photo, left: 140, top: 290 }]).png().toBuffer()
}

export async function polaroid(buf, caption = '') {
    const photo = await cover(buf, 760, 760)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="1000"><rect width="100%" height="100%" fill="#fff"/><text x="430" y="900" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#333">${esc(caption.slice(0, 32))}</text></svg>`
    const card = await sharp(Buffer.from(svg)).composite([{ input: photo, left: 50, top: 50 }]).png().toBuffer()
    return sharp(card).rotate(-3, { background: '#e9e3dc' }).flatten({ background: '#e9e3dc' }).extend({ top: 30, bottom: 30, left: 30, right: 30, background: '#e9e3dc' }).jpeg({ quality: 92 }).toBuffer()
}

export async function glitch(buf) {
    const src = await sharp(buf).rotate().resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).removeAlpha().toBuffer()
    const { width, height } = await sharp(src).metadata()
    const chan = (m) => sharp(src).recomb(m).toBuffer()
    const [r, g, b] = await Promise.all([
        chan([[1, 0, 0], [0, 0, 0], [0, 0, 0]]), chan([[0, 0, 0], [0, 1, 0], [0, 0, 0]]), chan([[0, 0, 0], [0, 0, 0], [0, 0, 1]])
    ])
    const shift = Math.max(6, Math.round(width * 0.015))
    return sharp({ create: { width, height, channels: 3, background: '#000' } })
        .composite([{ input: r, left: shift, top: 0, blend: 'add' }, { input: g, left: 0, top: 0, blend: 'add' }, { input: b, left: Math.max(0, -shift), top: 0, blend: 'add' }])
        .jpeg({ quality: 90 }).toBuffer()
}

export const blur = (buf, sigma = 12) => sharp(buf).rotate().blur(Math.min(50, Math.max(1, sigma))).jpeg({ quality: 90 }).toBuffer()

export async function pixel(buf, block = 16) {
    const img = sharp(buf).rotate()
    const { width, height } = await img.metadata()
    const w = Math.max(8, Math.round(width / Math.min(64, Math.max(4, block))))
    const small = await img.resize(w).toBuffer()
    return sharp(small).resize(width, height, { kernel: 'nearest' }).jpeg({ quality: 92 }).toBuffer()
}

export async function profileCard(avatarBuf, name, line1 = '', line2 = '') {
    const circle = Buffer.from('<svg width="260" height="260"><circle cx="130" cy="130" r="130" fill="#fff"/></svg>')
    const avatar = avatarBuf
        ? await sharp(avatarBuf).resize(260, 260, { fit: 'cover' }).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer()
        : await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><circle cx="130" cy="130" r="130" fill="#ff8fb8"/><text x="130" y="165" text-anchor="middle" font-size="110" fill="#fff" font-family="Arial">?</text></svg>')).png().toBuffer()
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b0a1f"/><stop offset="1" stop-color="#0a0a0f"/></linearGradient></defs><rect width="100%" height="100%" rx="32" fill="url(#g)"/><rect x="6" y="6" width="988" height="408" rx="28" fill="none" stroke="#ff8fb8" stroke-width="3" opacity=".7"/><g font-family="Arial, Helvetica, sans-serif"><text x="360" y="170" font-size="58" font-weight="bold" fill="#fff">${esc(name.slice(0, 20))}</text><text x="360" y="230" font-size="34" fill="#ff8fb8">${esc(line1.slice(0, 32))}</text><text x="360" y="285" font-size="28" fill="#fff" opacity=".7">${esc(line2.slice(0, 44))}</text><text x="960" y="390" text-anchor="end" font-size="24" fill="#fff" opacity=".4">Sakura-MD</text></g></svg>`
    return sharp(Buffer.from(svg)).composite([{ input: avatar, left: 70, top: 80 }]).png().toBuffer()
}