/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroup } from '../../lib/guard.js'

let handler = async (m, { notifReply }) => {
    const g = getGroup(m.chat)
    return notifReply(
        g.toxicWords.length
            ? g.toxicWords.map((w, i) => `${i + 1}. ${w}`).join('\n')
            : 'Belum ada kata terlarang.',
        'Anti Toxic'
    )
}

handler.command = ['listtoxic']
handler.desc = 'Daftar kata terlarang'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Anti Toxic'
handler.requirePrefix = true

export default handler
