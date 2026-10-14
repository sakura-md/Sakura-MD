/* Made By Seikagenou | Telegram : t.me/seikagenou */
import { box } from '../../lib/format.js'
import { readJpm, pause } from '../../lib/jpmstore.js'

let handler = async (m, { conn, text }) => {
    const message = String(text || '').trim()
    if (!message) return m.reply('Contoh: .jpmch Pengumuman channel')

    try {
        const { channels = [], delay = 1500 } = readJpm()
        if (!channels.length) return m.reply('Belum ada channel. Daftarkan dengan .addidch ID_CHANNEL')

        await m.reply(
            `📣 JPM Channel dimulai ke ${channels.length} channel terdaftar. Delay: ${delay / 1000} detik. Pengiriman hanya berhasil jika akun bot memiliki izin yang diperlukan.`
        )

        let ok = 0
        let fail = 0
        for (const jid of channels) {
            try {
                await conn.sendMessage(jid, { text: message })
                ok++
            } catch (e) {
                fail++
                console.error('[JPMCH]', jid, e?.message || e)
            }
            await pause(delay)
        }

        return m.reply(box('JPM CHANNEL SELESAI', [`Target: ${channels.length}`, `Berhasil: ${ok}`, `Gagal: ${fail}`]))
    } catch (e) {
        console.error('[JPMCH] error:', e)
        return m.reply(`❌ Gagal menjalankan JPM Channel: ${String(e?.message || e).split('\n')[0].slice(0, 200)}`)
    }
}

handler.command = ['jpmch']
handler.desc = 'Kirim pesan ke channel yang ID-nya terdaftar'
handler.tags = ['owner']
handler.creator = true
handler.requirePrefix = true

export default handler
