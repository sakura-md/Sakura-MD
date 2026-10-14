/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroup, saveGroups } from '../../lib/guard.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const word = text.trim().toLowerCase()
    const g = getGroup(m.chat)

    if (!word) return notifReply(`Contoh: ${pfxOf(prefix)}deltoxic kata`, 'Anti Toxic')
    if (!g.toxicWords.includes(word)) return notifReply('Kata itu tidak ada di daftar.', 'Anti Toxic')

    g.toxicWords = g.toxicWords.filter(w => w !== word)
    saveGroups()
    return notifReply('✅ Kata dihapus.', 'Anti Toxic')
}

handler.command = ['deltoxic']
handler.desc = 'Hapus kata terlarang'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Anti Toxic'
handler.requirePrefix = true

export default handler
