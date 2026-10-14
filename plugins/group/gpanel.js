/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { getGroupAdmins, isBotGroupAdmin } from '../../lib/myfunc.js'
import { getGroupStats } from '../../lib/activity.js'

let handler = async (m, { conn, prefix, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Group Panel')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Group Panel')

    const admins = getGroupAdmins(groupMetadata.participants)
    const stats = getGroupStats(m.chat)
    const trackedMembers = Object.keys(stats).length

    const body = `*🎛️ Group Panel — ${groupMetadata.subject}*

➤ Total Member : ${groupMetadata.participants.length}
➤ Total Admin : ${admins.length}
➤ Bot Admin? : ${isBotGroupAdmin(groupMetadata, conn) ? '✅ Ya' : '❌ Belum'}
➤ Mode Grup : ${groupMetadata.announce ? 'Cuma Admin bisa kirim pesan' : 'Semua bisa kirim pesan'}
➤ Info Grup Terkunci : ${groupMetadata.restrict ? 'Ya (cuma Admin edit)' : 'Tidak'}
➤ Member Terpantau Aktivitas : ${trackedMembers} (sejak bot online)

*Quick commands:*
┆ ${prefix}infogc — info lengkap grup
┆ ${prefix}topaktif — member paling aktif
┆ ${prefix}inaktif — member paling tidak aktif
┆ ${prefix}lockgrup on/off — kunci chat
┆ ${prefix}setjoin on/off — approval member baru
┆ ${prefix}backupgrup — backup data grup`

    await notifReply(body, 'Group Panel')
}

handler.command = ['gpanel']
handler.group = true
handler.desc = 'Dashboard ringkas info & quick command grup'

export default handler