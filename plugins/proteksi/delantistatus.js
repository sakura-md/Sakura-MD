/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, num } from '../../lib/format.js'
import { getGroup, saveGroups } from '../../lib/guard.js'
import { sendInapp } from '../../lib/inapp.js'

let handler = async (m, { args, conn, notifReply }) => {
    const g = getGroup(m.chat)
    g.statusLog ??= {}

    // Ada tag / reply / nomor -> hapus hitungan member itu saja. Tanpa target -> hapus semua.
    const target = getTarget(m, args)

    if (target) {
        const key = num(target)
        if (!g.statusLog[key]) return notifReply('Member itu belum punya hitungan status.', 'Del Anti Status')

        delete g.statusLog[key]
        saveGroups()

        return sendInapp(conn, m, `✅ Hitungan status @${key} dihapus, kesempatannya kembali penuh.`, { mentions: [target] })
    }

    const total = Object.keys(g.statusLog).length
    if (!total) return notifReply('Belum ada hitungan status di grup ini.', 'Del Anti Status')

    g.statusLog = {}
    saveGroups()

    return notifReply(`✅ Hitungan status ${total} member dihapus. Semua kesempatan kembali penuh.`, 'Del Anti Status')
}

handler.command = ['delantistatus', 'resetantistatus']
handler.desc = 'Hapus hitungan status grup (semua / satu member)'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Del Anti Status'
handler.requirePrefix = true

export default handler
