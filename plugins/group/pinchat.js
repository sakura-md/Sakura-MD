/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid } from '../../lib/myfunc.js'
import { pfxOf, toggleMsg, toggleExample } from '../../lib/format.js'

// NOTE: WhatsApp's own hard limit is 3 pinned chats per account. Also,
// on a freshly-logged-in bot session, chatModify's app-state patch can be
// silently ignored by WhatsApp servers until the socket's chat/app-state
// sync has fully settled (no error is thrown either way). If this keeps
// reporting success without the chat actually showing as pinned, try
// again after the bot has been online a bit, and check it isn't already
// at the 3-pin limit on that WhatsApp account.
let handler = async (m, { conn, args, command, prefix, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Pin Chat')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Pin Chat')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Pin Chat')
    }

    const isUnpinCommand = ['unpin', 'unpinpesan'].includes(command)
    const mode = isUnpinCommand ? 'off' : (args[0] || 'on').toLowerCase()
    if (!['on', 'off'].includes(mode)) {
        return notifReply(toggleExample(pfxOf(prefix), 'pinchat'), 'Pin Chat')
    }
    const pin = mode === 'on'

    try {
        await conn.chatModify({ pin }, m.chat)

        // Best-effort verification: some Baileys builds expose the chat
        // store on conn.chats / conn.store.chats, so double check the
        // flag actually landed before claiming success.
        const chatEntry = conn.chats?.[m.chat] || conn.store?.chats?.get?.(m.chat)
        const verified = chatEntry ? !!chatEntry.pin === pin : null

        if (verified === false) {
            return notifReply(
                `⚠️ Perintah terkirim tapi status pin belum berubah di sisi bot. Kemungkinan slot pin sudah penuh (maks 3 chat) atau app-state belum sync sepenuhnya. Coba lagi sebentar lagi.`,
                'Pin Chat'
            )
        }

        await notifReply(toggleMsg(pin, 'Pin Chat'), 'Pin Chat')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal pin/unpin chat ini. Kemungkinan slot pin sudah penuh (maks 3) atau gagal di sisi WhatsApp.', 'Pin Chat')
    }
}

handler.command = ['pinchat', 'pin', 'pinpesan', 'unpin', 'unpinpesan']
handler.group = true
handler.desc = 'Pin/unpin chat grup ini (dari sisi bot)'

export default handler