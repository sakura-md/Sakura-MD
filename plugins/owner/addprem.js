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

function readPremium() {
    try {
        if (!fs.existsSync(premPath)) {
            fs.mkdirSync(path.dirname(premPath), {
                recursive: true
            })

            fs.writeFileSync(
                premPath,
                JSON.stringify([], null, 2)
            )
        }

        const data = JSON.parse(
            fs.readFileSync(premPath, 'utf8')
        )

        return Array.isArray(data) ? data : []
    } catch (e) {
        console.error('[addprem] gagal membaca premium.json:', e)
        return []
    }
}

function savePremium(premium) {
    fs.writeFileSync(
        premPath,
        JSON.stringify(premium, null, 2)
    )
}

function cleanNumber(value = '') {
    return String(value)
        .replace(/[^0-9]/g, '')
}

function getTargetNumber(m, args) {
    // ========================================================
    // 1. TAG / MENTION
    // ========================================================
    const mentioned = m.mentionedJid?.[0]

    if (mentioned) {
        return cleanNumber(
            mentioned.split('@')[0]
        )
    }

    // ========================================================
    // 2. REPLY PESAN
    // ========================================================
    if (m.quoted?.sender) {
        return cleanNumber(
            m.quoted.sender.split('@')[0]
        )
    }

    // ========================================================
    // 3. NOMOR DARI ARGUMENT
    // ========================================================
    if (args?.[0]) {
        return cleanNumber(args[0])
    }

    return ''
}

let handler = async (
    m,
    {
        args,
        conn,
        notifReply
    }
) => {
    const number = getTargetNumber(m, args)

    if (!number) {
        return notifReply(
            'Tag orang atau masukkan nomor.\n\n' +
            'Contoh:\n' +
            '.addprem 628xxx\n' +
            '.addprem @628xxx\n\n' +
            'Atau reply pesan orang tersebut dengan .addprem',
            'Add Premium'
        )
    }

    if (number.length < 8) {
        return notifReply(
            'Nomor tidak valid.',
            'Add Premium'
        )
    }

    const target = `${number}@s.whatsapp.net`

    // ========================================================
    // CEK NOMOR WHATSAPP
    // ========================================================
    const cek = await conn
        .onWhatsApp(target)
        .catch(() => [])

    if (!cek?.length) {
        return notifReply(
            'Nomor tidak valid / tidak terdaftar di WhatsApp.',
            'Add Premium'
        )
    }

    // ========================================================
    // DATABASE PREMIUM
    // ========================================================
    const premium = readPremium()

    const exists = premium.some(item => {
        const savedNumber = cleanNumber(
            String(item).split('@')[0]
        )

        return savedNumber === number
    })

    if (exists) {
        return notifReply(
            `${number} sudah menjadi Premium`,
            'Add Premium'
        )
    }

    premium.push(target)

    savePremium(premium)

    await notifReply(
        `✅ ${number} telah menjadi Premium.`,
        'Add Premium'
    )
}

handler.command = ['addprem', 'addpremium']
handler.creator = true

export default handler