/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { pfxOf } from '../../lib/format.js'

let handler = async (m, { conn, prefix, notifReply, meta }) => {
    if (!m.quoted) {
        return notifReply(
            `Reply pesan yang mau di-tag ke semua member, lalu ketik ${pfxOf(prefix)}totag`,
            'Totag'
        )
    }

    const q = m.quoted
    const mentions = meta.participants.map(p => p.id)
    const type = q.mtype

    if ([
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'stickerMessage',
        'documentMessage'
    ].includes(type)) {
        const buffer = await q.download()
        const kind = type.replace('Message', '')
        const payload = {
            [kind]: buffer,
            mentions
        }

        if (q.caption) payload.caption = q.caption

        if (kind === 'audio') {
            payload.mimetype = q.mimetype || 'audio/mpeg'
        }

        if (kind === 'document') {
            payload.mimetype = q.mimetype
            payload.fileName = q.fileName || 'file'
        }

        return conn.sendMessage(m.chat, payload)
    }

    if (!q.text) {
        return notifReply('Jenis pesan itu tidak didukung.', 'Totag')
    }

    await conn.sendMessage(m.chat, {
        text: q.text,
        mentions
    })
}

handler.command = ['totag']
handler.desc = 'Mention semua member dengan meneruskan pesan reply'
handler.tags = ['group']
handler.group = true
handler.admin = true
handler.title = 'Totag'
handler.requirePrefix = true

export default handler
