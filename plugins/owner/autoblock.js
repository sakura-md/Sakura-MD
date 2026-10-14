/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toggleMsg, toggleExample, pfxOf } from '../../lib/format.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const settingPath = path.join(__dirname, '../../database/autoblock.json')

function readSetting() {
    try {
        const data = JSON.parse(fs.readFileSync(settingPath, 'utf8'))
        if (!Array.isArray(data.blocked)) data.blocked = []
        return data
    } catch (e) {
        return { enabled: false, blocked: [] }
    }
}

function writeSetting(data) {
    fs.writeFileSync(settingPath, JSON.stringify(data, null, 2))
}

// Dipanggil dari handler.js untuk setiap pesan masuk. Saat aktif, semua DM diblokir kecuali creator/owner; grup tidak terpengaruh.
// Return true kalau pesan ini harus dihentikan (pengirim diblokir / sudah diblokir),
// return false kalau pemrosesan pesan boleh lanjut seperti biasa.
export async function runAutoblock(conn, m, config) {
    if (!m || m.fromMe) return false
    if (m.isGroup) return false
    if (!m.chat || m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) return false

    const setting = readSetting()
    if (!setting.enabled) return false

    const number = String(m.sender || '').split('@')[0]
    if (!number) return false

    const botNumber = conn.decodeJid(conn.user.id).split('@')[0]
    if (number === botNumber) return false

    const creatorList = [botNumber, ...(config.creator || [])]
        .map(v => String(v).replace(/[^0-9]/g, ''))
    if (creatorList.includes(number)) return false

    // Creator/Owner dikecualikan. Premium biasa tetap terkena Autoblock.
    if (m.isOwner) return false

    // Tetap kirim perintah block pada setiap DM. Jika nomor dibuka blokirnya manual,
    // pesan berikutnya akan memblokirnya kembali. Database hanya mencegah duplikasi catatan.
    try {
        await conn.updateBlockStatus(m.sender, 'block')
    } catch (e) {
        console.error('[Autoblock] Gagal block', m.sender, e)
        return true // hentikan pemrosesan command walau permintaan block gagal
    }

    if (!setting.blocked.includes(m.sender)) {
        setting.blocked.push(m.sender)
        writeSetting(setting)
    }
    return true
}

let handler = async (m, { args, prefix, notifReply }) => {
    const mode = (args[0] || '').toLowerCase()

    if (!['on', 'off'].includes(mode)) {
        return notifReply(toggleExample(pfxOf(prefix), 'autoblock'), 'Autoblock')
    }

    const setting = readSetting()
    setting.enabled = mode === 'on'
    writeSetting(setting)

    await notifReply(
        toggleMsg(setting.enabled, 'Autoblock'),
        'Autoblock'
    )
}

handler.command = ['autoblock']
handler.owner = true
handler.desc = 'Blokir otomatis semua pengirim DM kecuali creator/owner dan simpan JID ke database'

export default handler