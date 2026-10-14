/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin, isSameJid, getBotJid, parseMention } from '../../lib/myfunc.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn, args, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Kick')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Kick')

    const botJid = getBotJid(conn)

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Kick')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat kick member.', 'Kick')
    }

    const mentioned = m.msg?.contextInfo?.mentionedJid || []
    const fromText = parseMention(args.join(' '))
    const target = mentioned[0] || fromText[0] || m.quoted?.sender

    if (!target) return notifReply('Tag, reply, atau sebutkan nomor orang yang mau di-kick', 'Kick')
    if (isSameJid(target, botJid)) return notifReply('Gak bisa kick bot sendiri.', 'Kick')
    if (isGroupAdminJid(groupMetadata.participants, target) && !m.isOwner) return notifReply('Gak bisa kick sesama Admin Grup', 'Kick')

    try {
        await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
        // @tag asli: nomor diambil dari jid, jid-nya dikirim lewat mentions
        const tag = String(target).split('@')[0].split(':')[0]
        await sendInapp(conn, m, `✅ @${tag} *berhasil dikeluarkan dari grup*`, { mentions: [target] })
    } catch (e) {
        console.error(e)
        await notifReply('Gagal kick member, coba lagi.', 'Kick')
    }
}

handler.command = ['kick', 'keluarkan']
handler.group = true
handler.desc = 'Kick member dari grup'

export default handler