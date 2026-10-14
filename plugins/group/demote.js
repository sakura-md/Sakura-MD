/*
Made By Seikagenou
Telegram : t.me/seikagenou
Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin, isSameJid, parseMention } from '../../lib/myfunc.js'

let handler = async (m, { conn, args, notifReply }) => {
if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup', 'Demote')

const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi', 'Demote')

if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner)
    return notifReply('Fitur ini khusus Admin Grup', 'Demote')

if (!isBotGroupAdmin(groupMetadata, conn))
    return notifReply('Bot harus jadi Admin Grup dulu buat demote member', 'Demote')

const mentioned = m.msg?.contextInfo?.mentionedJid || []
const fromText = parseMention(args.join(' '))
const target = mentioned[0] || fromText[0] || m.quoted?.sender

if (!target)
    return notifReply('Tag atau reply Admin yang mau diturunkan', 'Demote')

const alreadyAdmin = isGroupAdminJid(groupMetadata.participants, target)
if (!alreadyAdmin)
    return notifReply('Orang itu bukan Admin', 'Demote')

const participant = groupMetadata.participants.find(p =>
    isSameJid(p.id, target) ||
    (p.lid && isSameJid(p.lid, target)) ||
    (p.phoneNumber && isSameJid(p.phoneNumber, target))
)

const targetJid = participant?.id || target
const displayTarget = `@${targetJid.split('@')[0]}`

try {
    await conn.groupParticipantsUpdate(m.chat, [targetJid], 'demote')

    await conn.sendMessage(m.chat, {
        text: `✅ ${displayTarget} berhasil diturunkan dari Admin`,
        mentions: [targetJid]
    }, { quoted: m })
} catch (e) {
    console.error(e)
    await notifReply('Gagal memproses demote, coba lagi', 'Demote')
}

}

handler.command = ['demote', 'turonadmin']
handler.group = true
handler.desc = 'Turunkan Admin Grup'

export default handler