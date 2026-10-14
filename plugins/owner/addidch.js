/* Made By Seikagenou | Telegram : t.me/seikagenou */
import { readJpm, writeJpm, normalizeChannelId } from '../../lib/jpmstore.js'

let handler = async (m, { text, prefix, notifReply }) => {
 const id = normalizeChannelId(text || m.quoted?.text)
 if (!id) return notifReply(`Contoh: ${prefix}addidch 120363xxxxxxxxxx@newsletter
Kirim ID channel (@newsletter), bukan nama channel.`, 'Add ID Channel')
 const db = readJpm(); if (!db.channels.includes(id)) db.channels.push(id); writeJpm(db)
 return notifReply(`✅ Channel disimpan.
ID: ${id}
Total terdaftar: ${db.channels.length}`, 'Add ID Channel')
}

handler.command = ['addidch']
handler.desc = 'Daftarkan ID channel untuk JPM channel'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Add ID Channel'
handler.requirePrefix = true

export default handler
