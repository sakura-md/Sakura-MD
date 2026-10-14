/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const premPath = path.join(__dirname, '../../database/premium.json')

let handler = async (m, { args, notifReply }) => {
    if (!args[0]) {
        return notifReply(
            'Contoh:\n.delprem 628xxx',
            'Delete Premium'
        )
    }

    // Ambil nomor saja
    const number = args[0].replace(/[^0-9]/g, '')

    if (!number) {
        return notifReply(
            'Nomor tidak valid.',
            'Delete Premium'
        )
    }

    // JID yang disimpan di premium.json
    const target = number + '@s.whatsapp.net'

    const premium = JSON.parse(
        fs.readFileSync(premPath, 'utf8')
    )

    const idx = premium.indexOf(target)

    if (idx === -1) {
        return notifReply(
            `${number} bukan Premium`,
            'Delete Premium'
        )
    }

    premium.splice(idx, 1)

    fs.writeFileSync(
        premPath,
        JSON.stringify(premium, null, 2)
    )

    await notifReply(
        `✅ ${number} sudah bukan Premium`,
        'Delete Premium'
    )
}

handler.command = ['delprem', 'delpremium']
handler.creator = true

export default handler