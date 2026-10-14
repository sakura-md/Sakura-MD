/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'

let handler = async (m, { conn, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Set PP Grup')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Set PP Grup')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Set PP Grup')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat ganti foto grup.', 'Set PP Grup')
    }

    const media = (m.quoted && m.quoted.mtype === 'imageMessage') ? m.quoted
        : (m.mtype === 'imageMessage') ? m
        : null

    if (!media) return notifReply('Kirim/reply foto dengan caption .setppgc', 'Set PP Grup')

    try {
        const buffer = await media.download()
        await conn.updateProfilePicture(m.chat, buffer)
        await notifReply('✅ Foto grup berhasil diganti.', 'Set PP Grup')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal ganti foto grup, coba lagi.', 'Set PP Grup')
    }
}

handler.command = ['setppgc', 'fotogrup', 'setppgroup']
handler.group = true
handler.desc = 'Ganti foto profil grup (reply/kirim foto)'

export default handler