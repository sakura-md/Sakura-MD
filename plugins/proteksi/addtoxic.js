/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroup, saveGroups } from '../../lib/guard.js'
import { pfxOf } from '../../lib/format.js'

let handler = async (m, { text, prefix, notifReply }) => {
    const word = text.trim().toLowerCase()
    if (!word || word.length > 30) {
        return notifReply(
            `Contoh: ${pfxOf(prefix)}addtoxic kata\n(maks 30 karakter)`,
            'Anti Toxic'
        )
    }

    const g = getGroup(m.chat)
    if (g.toxicWords.includes(word)) return notifReply('Kata itu sudah ada di daftar.', 'Anti Toxic')
    if (g.toxicWords.length >= 200) return notifReply('Daftar penuh (maks 200 kata).', 'Anti Toxic')

    g.toxicWords.push(word)
    saveGroups()
    return notifReply(`✅ Kata ditambahkan. Total: ${g.toxicWords.length}`, 'Anti Toxic')
}

handler.command = ['addtoxic']
handler.desc = 'Tambah kata terlarang'
handler.tags = ['proteksi']
handler.group = true
handler.admin = true
handler.title = 'Anti Toxic'
handler.requirePrefix = true

export default handler
