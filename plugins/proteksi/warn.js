/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getTarget, pfxOf } from '../../lib/format.js'
import { isGroupAdminJid } from '../../lib/myfunc.js'
import { addWarn } from '../../lib/guard.js'

let handler = async (m, { conn, args, prefix, notifReply, meta }) => {
    const target = getTarget(m, args)
    if (!target) {
        return notifReply(
            `Tag/reply member.\nContoh: ${pfxOf(prefix)}warn @user spam`,
            'Warn'
        )
    }

    const reason = args
        .filter(a => !/^@?\d{5,}$/.test(a))
        .join(' ')
        .trim() || 'Pelanggaran aturan grup'

    if (isGroupAdminJid(meta.participants, target)) {
        return notifReply('Tidak bisa memberi warning ke Admin Grup.', 'Warn')
    }

    await addWarn(conn, m, target, reason, meta)
}

handler.command = ['warn']
handler.desc = 'Beri peringatan ke member'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Warn'
handler.requirePrefix = true

export default handler
