/* Made By Seikagenou | Telegram : t.me/seikagenou */
import { readJpm, writeJpm } from '../../lib/jpmstore.js'

let handler = async (m, { text, notifReply }) => {
 const db = readJpm(); if (!text.trim()) return notifReply(`Delay saat ini: ${(db.delay || 1500)/1000} detik
Contoh: .setdelay 2`, 'Set Delay')
 const sec = Number(text.trim()); if (!Number.isFinite(sec) || sec < 1 || sec > 3600) return notifReply('Masukkan angka 1–3600 detik.', 'Set Delay')
 db.delay = Math.round(sec * 1000); writeJpm(db); return notifReply(`✅ Delay JPM diatur menjadi ${sec} detik.`, 'Set Delay')
}

handler.command = ['setdelay']
handler.desc = 'Atur jeda pengiriman JPM dalam detik'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Set Delay JPM'
handler.requirePrefix = true

export default handler
