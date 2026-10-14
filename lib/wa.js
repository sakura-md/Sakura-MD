/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import config from '../config.js'
import { tanggal } from './myfunc.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mediaDir = path.join(__dirname, '../media')

// ------------------------------------------------------------------
// Thumbnail bot (dipakai header pesan tombol, sama seperti menu lain)
// ------------------------------------------------------------------
const thumbCache = new Map()

export async function getThumb(file = 'thumb.jpg') {
    if (thumbCache.has(file)) return thumbCache.get(file)
    let thumb
    try {
        thumb = await sharp(path.join(mediaDir, file)).resize(300, 300).jpeg({ quality: 80 }).toBuffer()
    } catch {
        thumb = Buffer.alloc(0)
    }
    thumbCache.set(file, thumb)
    return thumb
}

async function buildButtonsMessage({ title, text, footer, buttons, thumbFile }) {
    return {
        buttonsMessage: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: config.botName,
                address: title || `📍${tanggal(Date.now())}`,
                jpegThumbnail: await getThumb(thumbFile)
            },
            contentText: text,
            footerText: footer || '',
            buttons,
            headerType: 6
        }
    }
}

// Pesan dengan tombol quick-reply (maks 3 tombol). Jika gagal terkirim, jatuh ke teks biasa.
// items: [{ id, label }]
export async function sendChoiceButtons(conn, m, { title, text, footer = '', items, fallbackText, thumbFile }) {
    try {
        const buttons = items.slice(0, 3).map(item => ({
            buttonId: item.id,
            buttonText: { displayText: item.label },
            type: 1
        }))
        const content = await buildButtonsMessage({ title, text, footer, buttons, thumbFile })
        return await conn.sendMessage(m.chat, content, { quoted: m })
    } catch (e) {
        console.error('[wa] sendChoiceButtons gagal, kirim teks biasa:', e?.message || e)
        return conn.sendMessage(m.chat, { text: fallbackText || text }, { quoted: m })
    }
}

// Pesan dengan tombol daftar (single_select). Jika gagal terkirim, jatuh ke teks biasa.
// sections: [{ title, rows: [{ title, description, id }] }]
export async function sendChoiceList(conn, m, { title, text, footer = '', listTitle = 'Pilih', buttonLabel = '☰ pilih', highlight = '', sections, fallbackText, thumbFile }) {
    try {
        const buttons = [{
            buttonId: 'choice',
            buttonText: { displayText: buttonLabel },
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: listTitle,
                    sections: sections.map(section => ({
                        title: section.title,
                        ...(highlight ? { highlight_label: highlight } : {}),
                        rows: section.rows.map(row => ({
                            header: '',
                            title: row.title,
                            description: row.description || '',
                            id: row.id
                        }))
                    }))
                })
            },
            type: 1
        }]
        const content = await buildButtonsMessage({ title, text, footer, buttons, thumbFile })
        return await conn.sendMessage(m.chat, content, { quoted: m })
    } catch (e) {
        console.error('[wa] sendChoiceList gagal, kirim teks biasa:', e?.message || e)
        return conn.sendMessage(m.chat, { text: fallbackText || text }, { quoted: m })
    }
}

// ------------------------------------------------------------------
// Media: cari gambar/video di pesan itu sendiri (caption) atau di pesan yang di-reply
// ------------------------------------------------------------------
const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toNumber()
    return Number(value) || 0
}

// kind: 'image' | 'video'. Return null kalau tidak ada media yang cocok.
export function getMediaSource(m, kind) {
    const candidates = [m, m?.quoted].filter(Boolean)
    for (const ref of candidates) {
        const mtype = ref.mtype
        const content = ref.msg
        if (!mtype || !content || typeof content !== 'object') continue

        let mime = ''
        if (mtype === `${kind}Message`) {
            mime = String(content.mimetype || `${kind}/*`)
        } else if (mtype === 'documentMessage' && String(content.mimetype || '').startsWith(`${kind}/`)) {
            mime = String(content.mimetype)
        } else {
            continue
        }

        if (typeof ref.download !== 'function') continue
        return {
            ref,
            mtype,
            mime,
            size: toNumber(content.fileLength),
            download: () => ref.download()
        }
    }
    return null
}