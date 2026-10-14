/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'
import { pfxOf, box } from '../../lib/format.js'
import { sleep } from '../../lib/myfunc.js'

let handler = async (m, { conn, text, prefix }) => {
    const t = (
        text.trim() ||
        m.quoted?.text ||
        ''
    ).trim()

    if (!t) {
        return m.reply(
            `Contoh: ${pfxOf(prefix)}bcgroup Halo grup`
        )
    }

    const targets = Object.keys(
        await conn.groupFetchAllParticipating().catch(() => ({}))
    )

    const MAX = 150
    const list = targets.slice(0, MAX)

    if (!list.length) {
        return m.reply(
            'Tidak ada grup yang tersedia.'
        )
    }

    await m.reply(
        `📢 Mengirim ke ${list.length} grup${targets.length > MAX ? ` (dibatasi maks ${MAX})` : ''}...`
    )

    let ok = 0
    let fail = 0

    for (const jid of list) {
        try {
            await conn.sendMessage(jid, {
                text: `📢 *Pengumuman ${config.botName}*\n${t}`
            })

            ok++
        } catch {
            fail++
        }

        await sleep(1500)
    }

    await m.reply(
        box('BROADCAST SELESAI', [
            `Berhasil : ${ok}`,
            `Gagal    : ${fail}`
        ])
    )
}

handler.command = ['bcgroup', 'bcgc']
handler.desc = 'Broadcast ke semua grup bot'
handler.tags = ['owner']
handler.creator = true
handler.requirePrefix = true

export default handler
