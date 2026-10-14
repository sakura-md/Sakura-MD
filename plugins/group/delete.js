/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import {
    isGroupAdminJid,
    isBotGroupAdmin
} from '../../lib/myfunc.js'

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) {
        return notifReply(
            'Command ini cuma bisa dipakai di dalam grup.',
            'Delete'
        )
    }

    if (!m.quoted) {
        return notifReply(
            'Reply pesan yang mau dihapus dengan .delete',
            'Delete'
        )
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)

    if (!groupMetadata) {
        return notifReply(
            'Gagal mengambil data grup, coba lagi.',
            'Delete'
        )
    }

    try {
        const quotedKey = m.quoted.key || {
            remoteJid: m.chat,
            id: m.quoted.id,
            fromMe: m.quoted.fromMe || false,
            participant: m.quoted.sender
        }

        const isOwnMessage = quotedKey.fromMe === true

        if (!isOwnMessage) {
            const isAdmin =
                isGroupAdminJid(
                    groupMetadata.participants,
                    m.sender
                ) || m.isOwner

            if (!isAdmin) {
                return notifReply(
                    'Cuma Admin Grup yang bisa menghapus pesan orang lain.',
                    'Delete'
                )
            }

            if (!isBotGroupAdmin(groupMetadata, conn)) {
                return notifReply(
                    'Bot harus menjadi Admin Grup terlebih dahulu.',
                    'Delete'
                )
            }
        }

        await conn.sendMessage(m.chat, {
            delete: quotedKey
        })

        await notifReply(
            '*✅ Pesan Berhasil Di Hapus*',
            'Delete'
        )

    } catch (e) {
        console.error('[Delete Error]', e)

        await notifReply(
            `❌ Gagal menghapus pesan.\n${e?.message || 'Unknown error'}`,
            'Delete'
        )
    }
}

handler.command = ['delete', 'del', 'd']
handler.group = true
handler.desc = 'Hapus pesan dengan reply'

export default handler