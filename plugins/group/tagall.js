/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid } from '../../lib/myfunc.js'

let handler = async (m, { conn, text, notifReply }) => {
    if (!m.isGroup) {
        return notifReply(
            'Command ini cuma bisa dipakai di dalam grup.',
            'Tag All'
        )
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)

    if (!groupMetadata) {
        return notifReply(
            'Gagal mengambil data grup, coba lagi.',
            'Tag All'
        )
    }

    if (
        !isGroupAdminJid(groupMetadata.participants, m.sender) &&
        !m.isOwner
    ) {
        return notifReply(
            'Fitur ini khusus Admin Grup.',
            'Tag All'
        )
    }

    const pesan = text || m.quoted?.text || ''
    const participants = groupMetadata.participants || []

    if (!participants.length) {
        return notifReply(
            'Tidak ada anggota yang ditemukan.',
            'Tag All'
        )
    }

    // Ambil JID anggota dan hilangkan duplikat.
    const mentions = []
    const seen = new Set()

    for (const p of participants) {
        const jid = p.id || p.jid || p.lid
        if (!jid || seen.has(jid)) continue

        seen.add(jid)
        mentions.push(jid)
    }

    const lines = mentions.map((jid, i) =>
        `┃ ${String(i + 1).padStart(2, '0')}. @${jid.split('@')[0]}`
    ).join('\n')

    // Tidak ada baris kosong tambahan.
    const body = [
        '╭━━━「 📢 *TAG ALL* 」',
        `┃ 👥 Total Anggota: *${mentions.length}*`,
        pesan ? `┃ 💬 ${pesan.replace(/\n/g, '\n┃ 💬 ')}` : null,
        lines,
        '╰━━━━━━━━━━━━━━'
    ].filter(line => line !== null).join('\n')

    try {
        await conn.sendMessage(
            m.chat,
            {
                text: body,
                mentions
            },
            { quoted: m }
        )
    } catch (e) {
        console.error('[TagAll] Gagal mengirim pesan:', e)
        await notifReply(
            'Gagal kirim tagall, coba lagi.',
            'Tag All'
        )
    }
}

handler.command = ['tagall', 'everyone']
handler.group = true
handler.desc = 'Tag semua member grup dengan tampilan rapat'

export default handler