/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { listRentals, formatRemaining } from '../../lib/sewa.js'

const PER_PAGE = 15

let handler = async (m, { conn, args, prefix, notifReply }) => {
    const all = listRentals()
    if (!all.length) return notifReply('Belum ada data sewa.', 'List Sewa')

    const pages = Math.ceil(all.length / PER_PAGE)
    const page = Math.min(Math.max(parseInt(args[0]) || 1, 1), pages)
    const slice = all.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    let names = {}
    try {
        const groups = await conn.groupFetchAllParticipating()
        names = Object.fromEntries(Object.entries(groups || {}).map(([id, g]) => [id, g.subject]))
    } catch {}

    const active = all.filter(r => !r.expired).length
    const lines = slice.map((r, i) => {
        const sisa = r.permanent ? 'Permanen ♾️' : r.expired ? 'Habis' : formatRemaining(Number(r.expireDate) - Date.now())
        return `┃ ${(page - 1) * PER_PAGE + i + 1}. ${names[r.groupId] || '(bot tidak di grup ini)'}
┃    ${r.expired ? '❌' : '✅'} ${r.plan || '-'} • ${sisa}
┃    ${r.groupId}`
    })

    await notifReply(
        `╭━━〔 🌸 *LIST SEWA* 〕━━⬣
┃ Total : ${all.length} (aktif ${active})
┃ Hal   : ${page}/${pages}
┣━━━━━━━━━━━━━━━━━━⬣
${lines.join('\n┃\n')}
╰━━━━━━━━━━━━━━━━━━⬣${page < pages ? `\n> Lanjut: ${prefix || '.'}listsewa ${page + 1}` : ''}`,
        'List Sewa'
    )
}

handler.command = ['listsewa', 'sewalist']
handler.desc = 'Daftar semua grup yang menyewa bot'
handler.tags = ['sewa']
handler.owner = true
handler.title = 'List Sewa'
handler.requirePrefix = true

export default handler
