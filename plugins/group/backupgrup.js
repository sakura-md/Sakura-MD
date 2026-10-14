/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid } from '../../lib/myfunc.js'

const getPhoneJid = (p) => {
    const id = String(p?.id || '')

    if (id.endsWith('@s.whatsapp.net')) {
        return id
    }

    const phone = p?.jid || p?.phoneNumber || p?.number

    if (phone) {
        const number = String(phone).replace(/[^0-9]/g, '')
        if (number) return `${number}@s.whatsapp.net`
    }

    return id
}

const formatCreation = (timestamp) => {
    if (!timestamp) return null

    const date = new Date(
        Number(timestamp) * 1000
    )

    if (isNaN(date.getTime())) return null

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) {
        return notifReply(
            'Command ini cuma bisa dipakai di dalam grup.',
            'Backup Grup'
        )
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)

    if (!groupMetadata) {
        return notifReply(
            'Gagal mengambil data grup, coba lagi.',
            'Backup Grup'
        )
    }

    if (
        !isGroupAdminJid(groupMetadata.participants, m.sender) &&
        !m.isOwner
    ) {
        return notifReply(
            'Fitur ini khusus Admin Grup.',
            'Backup Grup'
        )
    }

    try {
        let inviteLink = null

        try {
            const code = await conn.groupInviteCode(m.chat)
            inviteLink = `https://chat.whatsapp.com/${code}`
        } catch {}

        const participants = groupMetadata.participants.map(p => ({
            id: getPhoneJid(p),
            admin: p.admin || null
        }))

        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => getPhoneJid(p))

        const backup = {
            id: groupMetadata.id,
            subject: groupMetadata.subject,
            desc: groupMetadata.desc || '',
            creation: formatCreation(groupMetadata.creation),
            inviteLink,
            admins,
            participants,
            backedUpAt: new Date().toISOString()
        }

        const buffer = Buffer.from(
            JSON.stringify(backup, null, 2)
        )

        const fileName =
            `backup-${groupMetadata.subject
                .replace(/[^a-z0-9]/gi, '_')
                .slice(0, 50)}.json`

        await conn.sendMessage(
            m.chat,
            {
                document: buffer,
                fileName,
                mimetype: 'application/json',
                caption:
                    `✅ Backup grup selesai\n\n` +
                    `👥 Member: ${participants.length}\n` +
                    `👑 Admin: ${admins.length}\n` +
                    `📅 Dibuat: ${formatCreation(groupMetadata.creation) || '-'}`
            },
            { quoted: m }
        )

    } catch (e) {
        console.error('[Backup Grup]', e)

        await notifReply(
            `❌ Gagal backup grup.\n${e?.message || 'Unknown error'}`,
            'Backup Grup'
        )
    }
}

handler.command = ['backupgrup']
handler.group = true
handler.desc = 'Backup data grup (nama, desc, member, link) jadi file JSON'

export default handler