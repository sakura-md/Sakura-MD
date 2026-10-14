/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroupStats } from '../../lib/activity.js'
import { sendInapp } from '../../lib/inapp.js'

const PAGE_SIZE = 50

let handler = async (m, { conn, text, notifReply }) => {
    if (!m.isGroup) {
        return notifReply(
            'Command ini cuma bisa dipakai di dalam grup.',
            'Member Inaktif'
        )
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)

    if (!groupMetadata) {
        return notifReply(
            'Gagal mengambil data grup, coba lagi.',
            'Member Inaktif'
        )
    }

    const stats = getGroupStats(m.chat)
    const participants = groupMetadata.participants || []

    // Hilangkan anggota duplikat berdasarkan JID utama.
    const uniqueParticipants = new Map()

    for (const p of participants) {
        const jid = p.id || p.jid || p.lid
        if (!jid) continue

        if (!uniqueParticipants.has(jid)) {
            uniqueParticipants.set(jid, p)
        }
    }

    const list = [...uniqueParticipants.values()]
        .map(p => {
            const jid = p.id || p.jid || p.lid
            const data = stats[jid] || {}

            return {
                id: jid,
                count: Number(
                    data.count ??
                    data.messages ??
                    data.totalMessages ??
                    data.messageCount ??
                    0
                ) || 0
            }
        })
        .sort((a, b) => a.count - b.count)

    if (!list.length) {
        return notifReply(
            'Tidak ada data anggota grup.',
            'Member Inaktif'
        )
    }

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
    const requestedPage = Number.parseInt(text?.trim(), 10)
    const page = Number.isFinite(requestedPage)
        ? Math.min(Math.max(requestedPage, 1), totalPages)
        : 1

    const start = (page - 1) * PAGE_SIZE
    const currentList = list.slice(start, start + PAGE_SIZE)

    const lines = currentList.map((e, i) => [
        `┃ ${String(start + i + 1).padStart(2, '0')}. @${e.id.split('@')[0]}`,
        `┃     💬 ${e.count} pesan`
    ].join('\n')).join('\n')

    const body = [
        '╭━━━「 😴 *MEMBER INAKTIF* 」',
        `┃ 👥 Total anggota: *${list.length}*`,
        `┃ 📄 Halaman: *${page}/${totalPages}*`,
        '┣━━━━━━━━━━━━━━',
        lines,
        '┣━━━━━━━━━━━━━━',
        '┃ 📊 Diurutkan dari pesan paling sedikit',
        page < totalPages
            ? `┃ ➡️ Berikutnya: *.inaktif ${page + 1}*`
            : null,
        page > 1
            ? `┃ ⬅️ Sebelumnya: *.inaktif ${page - 1}*`
            : null,
        '╰━━━━━━━━━━━━━━'
    ].filter(Boolean).join('\n')

    await sendInapp(
        conn,
        m,
        body,
        { mentions: currentList.map(e => e.id) }
    )
}

handler.command = ['inactive', 'memberinaktif']
handler.group = true
handler.desc = 'Daftar member dengan jumlah pesan paling sedikit'

export default handler