/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Reply bergaya "inapp_signup", dipakai SEMUA fitur (termasuk menu, sewa, access denied, maintenance, dll).
//
//   await sendInapp(conn, m, 'teks balasan')
//   await sendInapp(conn, m, '@628xx ...', { mentions: [jid] })    // dengan mention
//
// Judul (mis. *Sewa*, *Kick*, *Access Denied*) sengaja DIHILANGKAN: parameter `title` masih diterima
// supaya kode lama tidak error, tapi tidak pernah ditampilkan.
//
// patchInapp(conn) memasang pembungkus di conn.sendMessage: setiap pesan teks biasa
// (conn.sendMessage / m.reply) otomatis dikirim sebagai inapp_signup. Pesan media, reaksi, edit,
// hapus, poll, tombol/list, dll tidak disentuh.
//
// Fallback ke teks biasa HANYA dilakukan kalau pesan interaktif benar-benar belum terkirim.
// Kalau error terjadi setelah stanza keluar, pesan sudah sampai, jadi tidak dikirim ulang
// (penyebab pesan double di versi sebelumnya).
import { generateWAMessageFromContent, jidNormalizedUser } from '@sakuraa/baileys'
import config from '../config.js'

const BOT_NAME = config.botName || 'Sakura-MD'

// Kunci yang boleh ada di content agar pesan dianggap "teks biasa" dan dialihkan ke inapp_signup
const TEXT_ONLY_KEYS = new Set(['text', 'mentions', 'contextInfo'])

const rawSend = conn => conn.sendMessageRaw || conn.sendMessage.bind(conn)

// Node biz agar WhatsApp merender tombol native flow. Tanpa ini pesan sering tidak tampil di
// penerima dan memicu retry receipt, yang berujung pesan terkirim ulang.
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

async function relayInapp(conn, chat, body, { quoted, tagged = [], contextInfo } = {}) {
    let generatedMsg
    try {
        const mergedContext = { ...(contextInfo || {}) }
        if (tagged.length) mergedContext.mentionedJid = [...new Set([...(mergedContext.mentionedJid || []), ...tagged])]
        const hasContext = Object.keys(mergedContext).length > 0

        const interactiveMsg = {
            body: { text: body },
            footer: { text: BOT_NAME },
            header: { title: BOT_NAME, hasMediaAttachment: false },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: 'inapp_signup',
                        buttonParamsJson: JSON.stringify({})
                    }
                ],
                messageParamsJson: '{}'
            },
            ...(hasContext ? { contextInfo: mergedContext } : {})
        }

        generatedMsg = generateWAMessageFromContent(
            chat,
            {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: interactiveMsg
                    }
                }
            },
            {
                quoted,
                // harus JID bot sendiri, bukan chat tujuan
                userJid: jidNormalizedUser(conn.user?.id || chat),
                upload: conn.waUploadToServer
            }
        )

        await conn.relayMessage(chat, generatedMsg.message, {
            messageId: generatedMsg.key.id,
            additionalNodes: buildBizNodes(chat)
        })
        return generatedMsg
    } catch (e) {
        // stanza sudah terkirim (error cuma di pembukuan setelahnya) -> jangan kirim ulang
        if (e?.stanzaSent && generatedMsg) {
            console.warn('[inapp] error setelah pesan terkirim, fallback dilewati:', e?.message || e)
            return generatedMsg
        }
        console.error('[inapp] gagal kirim pesan interaktif, fallback ke teks:', e?.message || e)
        return rawSend(conn)(chat, { text: body, ...(tagged.length ? { mentions: tagged } : {}) }, { quoted })
    }
}

// title diabaikan (lihat catatan di atas)
export async function sendInapp(conn, m, text, { mentions = [], chat = m?.chat } = {}) {
    const tagged = Array.isArray(mentions) ? mentions.filter(Boolean) : []
    return relayInapp(conn, chat, String(text ?? ''), { quoted: m, tagged })
}

// Pembuat fungsi bergaya notifReply(text, title) tetapi tampil sebagai inapp_signup tanpa judul.
export const makeInappReply = (conn, m) =>
    (text) => sendInapp(conn, m, text)

// Pasang pembungkus conn.sendMessage: teks biasa -> inapp_signup. Aman dipanggil berulang.
export function patchInapp(conn) {
    if (conn.sendMessageRaw) return conn
    conn.sendMessageRaw = conn.sendMessage.bind(conn)

    conn.sendMessage = async (jid, content = {}, options = {}) => {
        const isPlainText =
            content &&
            typeof content.text === 'string' &&
            content.text.length > 0 &&
            Object.keys(content).every(k => TEXT_ONLY_KEYS.has(k)) &&
            // newsletter / status tidak mendukung pesan interaktif
            !String(jid).endsWith('@newsletter') &&
            !String(jid).endsWith('@broadcast')

        if (!isPlainText) return conn.sendMessageRaw(jid, content, options)

        const tagged = Array.isArray(content.mentions) ? content.mentions.filter(Boolean) : []
        return relayInapp(conn, jid, content.text, {
            quoted: options.quoted,
            tagged,
            contextInfo: content.contextInfo
        })
    }
    return conn
}

// Dipertahankan agar import lama tidak error. Sekarang TIDAK ada pengecualian: menu pun inapp_signup.
export function isMenuPluginFile() {
    return false
}
