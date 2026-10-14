/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getMediaSource } from '../../lib/wa.js'
import { getBotJid } from '../../lib/myfunc.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { conn, prefix, notifReply }) => {
    const media = getMediaSource(m, 'image')

    if (!media) {
        return notifReply(
            `Kirim/reply foto dengan caption ${pfxOf(prefix)}setppbot`,
            'Set PP Bot'
        )
    }

    if (media.size > 10 * 1024 * 1024) {
        return notifReply(
            'Foto terlalu besar (maks 10 MB).',
            'Set PP Bot'
        )
    }

    const buffer = await media.download()

    await conn.updateProfilePicture(
        getBotJid(conn),
        buffer
    )

    await notifReply(
        '✅ Foto profil bot diperbarui',
        'Set PP Bot'
    )
}

handler.command = ['setppbot']
handler.desc = 'Ubah foto profil bot (reply/kirim foto)'
handler.tags = ['owner']
handler.owner = true
handler.title = 'Set PP Bot'
handler.requirePrefix = true

export default handler
