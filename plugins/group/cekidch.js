/* Made By Seikagenou | Telegram : t.me/seikagenou */

import config from '../../config.js'

const TITLE = 'Cek ID Channel'
const LINK_RE = /whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i
const JID_RE = /\b(\d{5,}@newsletter)\b/i

// Respons newsletterMetadata bisa datar (name, subscribers) atau mentah (thread_metadata.name.text)
const unwrap = raw => raw?.xwa2_newsletter || raw?.data?.xwa2_newsletter || raw?.result || raw?.data || raw || {}
const asText = v => (v && typeof v === 'object' ? v.text ?? v.type ?? '' : v ?? '')

function readInfo(raw, fallbackId) {
    const md = unwrap(raw)
    const tm = md.thread_metadata || {}
    return {
        id: md.id || fallbackId,
        name: asText(md.name) || asText(tm.name) || '',
        subscribers: md.subscribers ?? md.subscribers_count ?? tm.subscribers_count ?? '',
        status: asText(md.state) || asText(tm.state) || '',
        verified: String(asText(md.verification) || asText(tm.verification)).toUpperCase() === 'VERIFIED'
    }
}

let handler = async (m, { conn, text, prefix, notifReply }) => {
    const input = String(text || '').trim()
    const code = input.match(LINK_RE)?.[1]
    const jid = input.match(JID_RE)?.[1]

    if (!code && !jid) {
        return notifReply(
            `Contoh:\n${prefix || '.'}cekidch https://whatsapp.com/channel/0029VaXXXXXXXXXXXXXXXX`,
            TITLE
        )
    }

    let raw
    try {
        raw = code
            ? await conn.newsletterMetadata('invite', code)
            : await conn.newsletterMetadata('jid', jid)
    } catch (e) {
        console.error('[cekidch]', e)
        return notifReply('❌ Gagal mengambil data channel. Pastikan link benar dan channel masih tersedia.', TITLE)
    }

    const info = readInfo(raw, jid)
    if (!info.id) return notifReply('❌ ID channel tidak ditemukan.', TITLE)

    if (!info.name) console.warn('[cekidch] nama kosong, respons mentah:', JSON.stringify(raw)?.slice(0, 600))

    const source = code ? `https://whatsapp.com/channel/${code}` : '-'

    const caption = [
        '*📢 INFO CHANNEL WHATSAPP*',
        '',
        `*• Nama :* ${info.name || '-'}`,
        `*• ID :* ${info.id}`,
        `*• Total Pengikut :* ${info.subscribers === '' ? '-' : info.subscribers}`,
        `*• Status :* ${info.status || '-'}`,
        `*• Verifikasi :* ${info.verified ? '✅ Ya' : '❌ Tidak'}`,
        '',
        `🔗 *Sumber:* ${source}`
    ].join('\n')

    // Tombol salin (cta_copy) — sama seperti cn.js
    const templateButtons = [
        {
            index: 1,
            displayText: 'Salin ID Channel',
            id: 'cekidch_copy',
            copy_code: info.id
        }
    ]

    try {
        return await conn.sendMessage(
            m.chat,
            {
                text: caption,
                footer: config.botName || 'Sakura-MD',
                templateButtons,
                templateMode: 'native'
            },
            { quoted: m }
        )
    } catch (e) {
        console.error('[cekidch] Gagal mengirim tombol:', e)
        return notifReply(`${caption}\n\n*ID Channel:*\n${info.id}`, TITLE)
    }
}

handler.command = ['cekidch']
handler.desc = 'Cek informasi dan ID channel WhatsApp'
handler.tags = ['group']
handler.group = true

export default handler
