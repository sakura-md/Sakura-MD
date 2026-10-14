/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateWAMessageContent, generateWAMessageFromContent } from '@sakuraa/baileys'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function sendGroupStatus(sock, jid, content) {
    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer
    })

    const messageSecret = crypto.randomBytes(32)

    const msg = generateWAMessageFromContent(jid, {
        messageContextInfo: {
            messageSecret
        },
        groupStatusMessageV2: {
            message: {
                ...inside,
                messageContextInfo: {
                    messageSecret
                }
            }
        }
    }, {})

    await sock.relayMessage(jid, msg.message, {
        messageId: msg.key.id
    })
}

let handler = async (m, { args, conn, notifReply }) => {
    if (!m.isGroup) return notifReply('Fitur ini hanya bisa dipakai di grup.', 'Group Story')

    const text = args.join(' ')
    let content = {}

    try {
        // Reply media
        if (m.quoted && (m.quoted.mtype === 'imageMessage' || m.quoted.mtype === 'videoMessage')) {
            const buffer = await m.quoted.download()

            if (m.quoted.mtype === 'imageMessage') {
                content = { image: buffer, caption: text || '' }
            }
            if (m.quoted.mtype === 'videoMessage') {
                content = { video: buffer, caption: text || '' }
            }
        }

        // Media langsung
        else if (m.mtype === 'imageMessage' || m.mtype === 'videoMessage') {
            const buffer = await m.download()

            if (m.mtype === 'imageMessage') {
                content = { image: buffer, caption: text || '' }
            }
            if (m.mtype === 'videoMessage') {
                content = { video: buffer, caption: text || '' }
            }
        }

        // Text saja
        else if (text) {
            content = {
                text: text,
                font: 0,
                backgroundColor: "#FF2E63"
            }
        }

        else {
            return notifReply('Contoh:\n.upsw Halo semua\nreply gambar .upsw\nreply video .upsw', 'Group Story')
        }

        await sendGroupStatus(conn, m.chat, content)
        await notifReply('📡 Story grup berhasil dipost!\n\nSekarang icon grup punya border hijau 😳', 'Group Story')

    } catch (err) {
        console.log(err)
        await notifReply('Gagal upload story, coba lagi ya.', 'Group Story')
    }
}

handler.command = ['upsw', 'upstory', 'storygc']
handler.group = true

export default handler