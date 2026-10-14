/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ownerPath = path.join(__dirname, '../../database/owner.json')

function readOwners() {
    try {
        if (!fs.existsSync(ownerPath)) {
            fs.mkdirSync(path.dirname(ownerPath), {
                recursive: true
            })

            fs.writeFileSync(
                ownerPath,
                JSON.stringify([], null, 2)
            )
        }

        const data = JSON.parse(
            fs.readFileSync(ownerPath, 'utf8')
        )

        return Array.isArray(data) ? data : []
    } catch (e) {
        console.error('[addowner] gagal membaca owner.json:', e)
        return []
    }
}

function saveOwners(owners) {
    fs.writeFileSync(
        ownerPath,
        JSON.stringify(owners, null, 2)
    )
}

function cleanNumber(value = '') {
    return String(value)
        .replace(/[^0-9]/g, '')
}

function getTargetNumber(m, args) {
    // ========================================================
    // 1. MENTION / TAG
    // ========================================================
    const mentioned = m.mentionedJid?.[0]

    if (mentioned) {
        return cleanNumber(
            mentioned.split('@')[0]
        )
    }

    // ========================================================
    // 2. REPLY
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
            'Tag orang atau masukkan nomor.\n\nContoh:\n.addowner 628xxx\n.addowner @628xxx\n\nAtau reply pesan orang tersebut dengan .addowner',
            'Add Owner'
        )
    }

    if (number.length < 8) {
        return notifReply(
            'Nomor tidak valid.',
            'Add Owner'
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
            'Add Owner'
        )
    }

    // ========================================================
    // DATABASE OWNER
    // ========================================================
    const owner = readOwners()

    // Database tetap menyimpan nomor/JID internal,
    // tetapi tidak pernah ditampilkan ke user.
    const exists = owner.some(item => {
        const savedNumber = cleanNumber(
            String(item).split('@')[0]
        )

        return savedNumber === number
    })

    if (exists) {
        return notifReply(
            `${number} sudah menjadi Owner.`,
            'Add Owner'
        )
    }

    owner.push(target)

    saveOwners(owner)

    await notifReply(
        `✅ ${number} telah menjadi Owner`,
        'Add Owner'
    )
}

handler.command = ['addowner', 'addown']
handler.creator = true

export default handler