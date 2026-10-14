/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from '../../lib/myfunc.js'

let handler = async (m, { conn, args, notifReply }) => {
    if (!m.isGroup) return notifReply('Command ini cuma bisa dipakai di dalam grup.', 'Add Member')

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) return notifReply('Gagal mengambil data grup, coba lagi.', 'Add Member')

    if (!isGroupAdminJid(groupMetadata.participants, m.sender) && !m.isOwner) {
        return notifReply('Fitur ini khusus Admin Grup.', 'Add Member')
    }
    if (!isBotGroupAdmin(groupMetadata, conn)) {
        return notifReply('Bot harus jadi Admin Grup dulu buat nambahin member.', 'Add Member')
    }

    if (!args[0]) return notifReply('Contoh:\n.add 628xxxxxxxxxx', 'Add Member')
    const number = args[0].replace(/[^0-9]/g, '')
    if (!number) return notifReply('Nomor tidak valid.', 'Add Member')
    const target = number + '@s.whatsapp.net'

    const cek = await conn.onWhatsApp(target).catch(() => [])
    if (!cek?.length) return notifReply('Nomor tidak valid / tidak terdaftar di WhatsApp.', 'Add Member')

    try {
        const res = await conn.groupParticipantsUpdate(m.chat, [target], 'add')
        const status = res?.[0]?.status
        if (status && status !== '200') {
            return notifReply(`Gagal nambahin ${number}. WhatsApp membatasi bot menambahkan nomor ini langsung — coba kirim invite link ke orangnya.`, 'Add Member')
        }
        await notifReply(`✅ ${number} berhasil ditambahkan ke grup.`, 'Add Member')
    } catch (e) {
        console.error(e)
        await notifReply('Gagal nambahin member, coba lagi.', 'Add Member')
    }
}

handler.command = ['add', 'tambah']
handler.group = true
handler.desc = 'Tambahkan member ke grup'

export default handler