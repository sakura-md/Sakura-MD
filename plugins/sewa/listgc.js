/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getRental, formatRemaining, timeLeftMs } from '../../lib/sewa.js'

const PER_PAGE = 15

let handler = async (m, { conn, args, prefix, notifReply }) => {
    const data = await conn.groupFetchAllParticipating()
    const groups = Object.values(data || {})
        .map(g => ({
            id: g.id,
            name: g.subject || '(tanpa nama)',
            members: Number(g.size) || g.participants?.length || 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))

    if (!groups.length) return notifReply('Bot tidak berada di grup mana pun.', 'List Grup')

    const pages = Math.ceil(groups.length / PER_PAGE)
    const page = Math.min(Math.max(parseInt(args[0]) || 1, 1), pages)
    const slice = groups.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    const totalMembers = groups.reduce((n, g) => n + g.members, 0)

    const lines = slice.map((g, i) => {
        const r = getRental(g.id)
        const sewa = !r
            ? '❌ Tanpa sewa'
            : r.permanent ? `✅ ${r.plan} • Permanen ♾️`
            : r.expired ? `❌ ${r.plan} • Habis`
            : `✅ ${r.plan} • ${formatRemaining(timeLeftMs(g.id))}`
        return `┃ ${(page - 1) * PER_PAGE + i + 1}. *${g.name}*
┃    🆔 ${g.id}
┃    👥 ${g.members.toLocaleString('id-ID')} member
┃    📦 ${sewa}`
    })

    await notifReply(
        `╭━━〔 🌸 *LIST GRUP BOT* 〕━━⬣
┃ Total grup : ${groups.length}
┃ Total member: ${totalMembers.toLocaleString('id-ID')}
┃ Hal : ${page}/${pages}
┣━━━━━━━━━━━━━━━━━━⬣
${lines.join('\n┃\n')}
╰━━━━━━━━━━━━━━━━━━⬣${page < pages ? `\n> Lanjut: ${prefix || '.'}listgc ${page + 1}` : ''}`,
        'List Grup'
    )
}

handler.command = ['listgc', 'listgrup', 'grouplist']
handler.desc = 'Daftar semua grup bot: nama, ID, jumlah member'
handler.tags = ['sewa']
handler.owner = true
handler.title = 'List Grup'
handler.requirePrefix = true

export default handler
