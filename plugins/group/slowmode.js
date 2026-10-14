/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid } from '../../lib/myfunc.js'

// In-memory only — cooldown state resets if the bot restarts. That's fine
// for a "slow chat down for a bit" feature; it doesn't need to survive restarts.
const settings = new Map() // groupId -> seconds
const lastMessage = new Map() // groupId:jid -> timestamp

export function checkSlowmode(groupId, jid) {
    const seconds = settings.get(groupId)
    if (!seconds) return { blocked: false }
    const key = `${groupId}:${jid}`
    const last = lastMessage.get(key) || 0
    const now = Date.now()
    if (now - last < seconds * 1000) {
        return { blocked: true, waitMs: seconds * 1000 - (now - last) }
    }
    lastMessage.set(key, now)
    return { blocked: false }
}

let handler = async (m, { conn, args, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Slowmode')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Slowmode')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Slowmode')
    }

    const arg = (args[0] || '').toLowerCase()
    if (arg === 'off') {
        settings.delete(m.chat)
        return notifReply('✅ Slowmode dimatikan.', 'Slowmode')
    }

    const seconds = parseInt(arg, 10)
    if (!seconds || seconds < 1) {
        return notifReply('Gunakan:\n*.slowmode 10* - jeda 10 detik antar pesan per member\n*.slowmode off* - matikan slowmode', 'Slowmode')
    }

    settings.set(m.chat, seconds)
    await notifReply(`✅ Slowmode aktif: member harus tunggu ${seconds} detik antar pesan.\n\n_Catatan: fitur ini cuma nge-warn/hapus, belum otomatis blokir kirim di sisi WhatsApp — pastikan handler.js manggil checkSlowmode() dari plugins/group/slowmode.js kalau mau ditegakkan otomatis._`, 'Slowmode')
}

handler.command = ['slowmode']
handler.group = true
handler.desc = 'Batasi jeda kirim pesan per member (in-memory)'

export default handler