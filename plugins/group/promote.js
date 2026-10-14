/*
Made By Seikagenou
Telegram : t.me/seikagenou
Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin, isSameJid, parseMention } from '../../lib/myfunc.js'

let handler = async (m, { conn, args, notifReply }) => {
if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup', 'Promote')

const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi', 'Promote')

if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner)
    return notifReply('Fitur ini khusus Admin Grup', 'Promote')

if (!isBotGroupAdmin(groupMetadata, conn))
    return notifReply('Bot harus jadi Admin Grup dulu buat promote member', 'Promote')

const mentioned = m.msg?.contextInfo?.mentionedJid || []
const fromText = parseMention(args.join(' '))
const target = mentioned[0] || fromText[0] || m.quoted?.sender

if (!target)
    return notifReply('Tag atau reply orang yang mau dijadikan Admin', 'Promote')

const alreadyAdmin = isGroupAdminJid(groupMetadata.participants, target)
if (alreadyAdmin)
    return notifReply('Orang itu udah jadi Admin', 'Promote')

const participant = groupMetadata.participants.find(p =>
    isSameJid(p.id, target) ||
    (p.lid && isSameJid(p.lid, target)) ||
    (p.phoneNumber && isSameJid(p.phoneNumber, target))
)

const targetJid = participant?.id || target
const displayTarget = `@${targetJid.split('@')[0]}`

try {
    await conn.groupParticipantsUpdate(m.chat, [targetJid], 'promote')

    await conn.sendMessage(m.chat, {
        text: `✅ ${displayTarget} berhasil dijadikan Admin`,
        mentions: [targetJid]
    }, { quoted: m })
} catch (e) {
    console.error(e)
    await notifReply('Gagal memproses promote, coba lagi', 'Promote')
}

}

handler.command = ['promote', 'jadiadmin']
handler.group = true
handler.desc = 'Jadikan Admin Grup'

export default handler