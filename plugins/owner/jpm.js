/* Made By Seikagenou | Telegram : t.me/seikagenou */
import { box } from '../../lib/format.js'
import { readJpm, pause } from '../../lib/jpmstore.js'

let handler = async (m, { conn, text }) => {
    const message = String(text || '').trim()
    if (!message) return m.reply('Contoh: .jpm Halo semua grup!\nTeks beberapa baris juga didukung.')

    try {
        const groups = Object.keys(await conn.groupFetchAllParticipating().catch(() => ({})))
        if (!groups.length) return m.reply('Bot belum tergabung dalam grup mana pun.')

        const { delay = 1500 } = readJpm()
        await m.reply(`📣 JPM dimulai ke ${groups.length} grup. Delay: ${delay / 1000} detik.`)

        let ok = 0
        let fail = 0
        for (const jid of groups) {
            try {
                await conn.sendMessage(jid, { text: message })
                ok++
            } catch {
                fail++
            }
            await pause(delay)
        }

        return m.reply(box('JPM GRUP SELESAI', [`Target: ${groups.length}`, `Berhasil: ${ok}`, `Gagal: ${fail}`]))
    } catch (e) {
        console.error('[JPM] error:', e)
        return m.reply(`❌ Gagal menjalankan JPM: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`)
    }
}

handler.command = ['jpm']
handler.desc = 'Kirim pesan ke semua grup yang diikuti bot'
handler.tags = ['owner']
handler.creator = true
handler.requirePrefix = true

export default handler
