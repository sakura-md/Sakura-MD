/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { num } from '../../lib/format.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn, meta }) => {
    const members = meta.participants.map(p => p.id)

    const shown = members.slice(0, 100)
    const extra = members.length > shown.length
        ? `\n… dan ${members.length - shown.length} lainnya`
        : ''

    await sendInapp(
        conn,
        m,
        `👥 *Member (${members.length})*\n\n${shown.map((j, i) => `${i + 1}. @${num(j)}`).join('\n')}${extra}`,
        { mentions: shown }
    )
}

handler.command = ['listmember', 'memberlist']
handler.desc = 'Daftar member grup'
handler.tags = ['group']
handler.group = true
handler.title = 'List Member'
handler.requirePrefix = true

export default handler
