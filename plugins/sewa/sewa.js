/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { prefix, pushname, notifReply }) => {
    const pfx = pfxOf(prefix)
    const nama = pushname || 'Kak'

    const text = `╭━━━〔 🌸 *SEWA BOT SAKURA-MD* 🌸 〕━━━⬣
┃ Hai @${nama} 😋
┃ Nih paket sewa + benefit nya 💕
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🧸 *PAKET BIASA* 〕━━⬣
┃ 1D - 2D   : Rp 500 - 2K
┃ 3D - 5D   : Rp 3K - 5K
┃ 7D - 12D  : Rp 6K - 10K
┃ 20D - 30D : Rp 10K - 25K
┃
┃ ✦ Full fitur bot
┃ ✦ Cocok buat pemula
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 💎 *PAKET MEDIUM* 〕━━⬣
┃ 1D - 2D   : Rp 1.5K - 3K
┃ 3D - 5D   : Rp 4K - 6K
┃ 7D - 12D  : Rp 7K - 11K
┃ 20D - 30D : Rp 12K - 22K
┃
┃ ✦ Semua fitur biasa
┃ ✦ Bisa jadi *Owner Bot*
┃   selama masa sewa 😏
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 👑 *PAKET PREMIUM* 〕━━⬣
┃ 1D - 2D   : Rp 2.5K - 4K
┃ 3D - 5D   : Rp 5K - 7K
┃ 7D - 12D  : Rp 8K - 12K
┃ 20D - 30D : Rp 13K - 25K
┃
┃ ✦ Bisa jadi *Partner Bot*
┃ ✦ Bisa dapat *Script*
┃ ✦ Dapet update terbaru
┃ ✦ Bisa request fitur
╰━━━━━━━━━━━━━━━━━━⬣

╭━━〔 🎁 *BONUS* 〕━━⬣
┃ ✦ menggunakan baileys @sakuraa/baileys
┃ ✦ Bisa custom durasi
┃ ✦ Kadang ada free sewa 😏
╰━━━━━━━━━━━━━━━━━━⬣

───────────────
> 💳 Ketik *${pfx}payment* untuk bayar`

    await notifReply(text, 'Sewa Sakura-MD')
}

handler.command = ['sewa']
handler.desc = 'Info paket dan benefit sewa bot'
handler.tags = ['sewa']
handler.sewaFree = true
handler.title = 'Sewa'
handler.requirePrefix = true

export default handler
