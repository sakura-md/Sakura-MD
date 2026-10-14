import * as baileys from '@sakuraa/baileys'
import { generateWAMessageFromContent, jidNormalizedUser } from '@sakuraa/baileys'

// ===============================
// SEND BUTTONS (native flow) + TEMPLATE BUTTONS
// ===============================

// Node biz yang sama dengan lib/inapp.js. Node `bot` WAJIB untuk chat pribadi: tanpa ini WhatsApp
// menerima stanza (relay tidak error, log "berhasil") tapi pesan interaktif tidak ditampilkan.
const buildBizNodes = chat => {
    const nodes = [
        {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: { type: 'native_flow', v: '1' },
                    content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                }
            ]
        }
    ]
    if (!String(chat).endsWith('@g.us')) nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } })
    return nodes
}

export function setupSendButtons(conn) {
    if (typeof conn.sendButtons === 'function') return conn

    // Native flow buttons (interactiveMessage), dengan header gambar/video opsional
    //   await conn.sendButtons(jid, {
    //       title, text, footer,
    //       image: { url: '...' },                         // opsional
    //       buttons: [
    //           { name: 'cta_url', buttonParamsJson: { display_text: 'Buka', url: 'https://...' } },
    //           { name: 'quick_reply', buttonParamsJson: { display_text: 'Menu', id: '.menu' } }
    //       ]
    //   }, { quoted: m })
    conn.sendButtons = async function (jid, content = {}, options = {}) {
        const { title = '', text = '', footer = '', buttons = [], image, video } = content

        const nativeButtons = buttons.map(button => ({
            name: button.name || '',
            buttonParamsJson:
                typeof button.buttonParamsJson === 'string'
                    ? button.buttonParamsJson
                    : JSON.stringify(button.buttonParamsJson || {})
        }))

        // Header media (gagal upload -> lanjut tanpa media, jangan batalkan seluruh pesan)
        let header = { title, hasMediaAttachment: false }
        const mediaSrc = image ? { image } : video ? { video } : null
        if (mediaSrc) {
            try {
                if (typeof baileys.prepareWAMessageMedia !== 'function') throw new Error('prepareWAMessageMedia tidak tersedia')
                const media = await baileys.prepareWAMessageMedia(mediaSrc, { upload: conn.waUploadToServer })
                header = { title, hasMediaAttachment: true, ...media }
            } catch (e) {
                console.warn('[sendButtons] header media dilewati:', e?.message || e)
            }
        }

        const interactiveMessage = {
            header,
            body: { text },
            footer: { text: footer },
            nativeFlowMessage: { buttons: nativeButtons, messageParamsJson: '{}' }
        }

        const generated = generateWAMessageFromContent(
            jid,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage
                    }
                }
            },
            // userJid harus JID bot sendiri, bukan chat tujuan
            { quoted: options.quoted, userJid: jidNormalizedUser(conn.user?.id || jid), upload: conn.waUploadToServer }
        )

        await conn.relayMessage(jid, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildBizNodes(jid)
        })

        return generated
    }

    // Template buttons (quickReply / url / call), teks biasa atau dengan media
    //   await conn.sendTemplateButtons(jid, {
    //       text: 'Halo', footer: 'Sakura-MD', title: 'Judul',          // title opsional
    //       image: { url: '...' },                                       // opsional (image/video/document)
    //       buttons: [
    //           { displayText: 'Menu', id: '.menu' },                    // quick reply
    //           { displayText: 'Website', url: 'https://example.com' },  // url
    //           { displayText: 'Hubungi', phoneNumber: '+628123456789' } // call
    //       ]
    //   }, { quoted: m })
    conn.sendTemplateButtons = async function (jid, content = {}, options = {}) {
        const { text = '', footer = '', title, buttons = [], image, video, document, mimetype, fileName } = content
        // Tombol tanpa isi (url kosong / tanpa id) dibuang supaya pesan tidak ditolak klien WhatsApp
        const valid = buttons.filter(b => b && b.displayText && (b.url || b.id || b.phoneNumber || b.copy_code))
        const templateButtons = valid.map((b, i) => ({ index: i + 1, ...b }))
        // templateMode: 'native' WAJIB: tanpa ini Baileys mengirim hydratedTemplate lama yang sudah
        // tidak dirender WhatsApp. Server tetap menerima (log "berhasil") tapi pesan tidak muncul.
        const payload = { footer, templateButtons, templateMode: 'native' }
        if (title) payload.title = title
        if (image) Object.assign(payload, { image, caption: text })
        else if (video) Object.assign(payload, { video, caption: text })
        else if (document) Object.assign(payload, { document, mimetype, fileName, caption: text })
        else payload.text = text
        return conn.sendMessage(jid, payload, options)
    }

    return conn
}

export default setupSendButtons
