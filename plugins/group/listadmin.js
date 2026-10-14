/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getGroupAdmins } from '../../lib/myfunc.js'
import { num, box } from '../../lib/format.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { conn, meta }) => {
    const admins = getGroupAdmins(meta.participants)

    await sendInapp(
        conn,
        m,
        box(
            `ADMIN (${admins.length})`,
            admins.map((j, i) => `${i + 1}. @${num(j)}`)
        ),
        { mentions: admins }
    )
}

handler.command = ['listadmin', 'adminlist']
handler.desc = 'Daftar admin grup'
handler.tags = ['group']
handler.group = true
handler.title = 'List Admin'
handler.requirePrefix = true

export default handler
