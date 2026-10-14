// =====================
// PLUGIN CUSTOM NAME (CN)
// =====================
// .cn <nama>  -> tombol salin menampilkan langsung teks CN.
// Template diambil dari .setcn (per grup) lewat lib/cnrules.js; di chat pribadi memakai template default.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../../config.js'
import { sendInapp } from '../../lib/inapp.js'
import { MAX_NAME_LENGTH, charLength, buildCnResults } from '../../lib/cnrules.js'

const CN_DB = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../database/cn.json'
)

function readCNDB() {
    try {
        if (!fs.existsSync(CN_DB)) return {}

        const raw = fs.readFileSync(CN_DB, 'utf8')
        return raw.trim() ? JSON.parse(raw) : {}
    } catch (e) {
        console.error('[CN] Error reading database:', e)
        return {}
    }
}

function saveCNDB(data) {
    try {
        fs.mkdirSync(path.dirname(CN_DB), { recursive: true })
        fs.writeFileSync(CN_DB, JSON.stringify(data, null, 2))
        return true
    } catch (e) {
        console.error('[CN] Error saving database:', e)
        return false
    }
}

const listText = results =>
    results.map((r, i) => `${i + 1}. ${r}`).join('\n\n')

// Tombol salin (cta_copy)
// Teks tombol langsung menampilkan hasil CN.
// Saat tombol ditekan, copy_code tetap berisi teks CN yang sama.
async function sendCnButtons(conn, m, results) {
    const templateButtons = results.map((result, i) => ({
        index: i + 1,
        displayText: result,
        id: `cn_${i + 1}`,
        copy_code: result
    }))

    return conn.sendMessage(
        m.chat,
        {
            text: `- ✦ *PENCET SALAH SATU TOMBOL* ✦`,
            footer: config.botName,
            templateButtons,
            templateMode: 'native'
        },
        { quoted: m }
    )
}

let handler = async (m, { conn, text }) => {
    const nama = String(text || '').trim()

    if (!nama) {
        return sendInapp(
            conn,
            m,
            `- ✨ Contoh : *.cn Fushiguro*`
        )
    }

    if (charLength(nama) > MAX_NAME_LENGTH) {
        return sendInapp(
            conn,
            m,
            `- ❎ Nama terlalu panjang (maks ${MAX_NAME_LENGTH} karakter).`
        )
    }

    // Satu sumber hasil dengan preview .setcn:
    // template grup (custom) atau default.
    const results = buildCnResults(
        nama,
        m.isGroup ? m.chat : ''
    )

    const db = readCNDB()

    db[m.sender] = {
        nama,
        templates: Object.fromEntries(
            results.map((r, i) => [i + 1, r])
        ),
        timestamp: new Date().toLocaleString('id-ID'),
        pushname:
            m.pushName ||
            db[m.sender]?.pushname ||
            'Unknown'
    }

    if (!saveCNDB(db)) {
        return sendInapp(
            conn,
            m,
            `- ❎ Gagal menyimpan data CN.`
        )
    }

    try {
        await sendCnButtons(conn, m, results)
    } catch (e) {
        console.error(
            '[CN] tombol salin gagal, kirim teks biasa:',
            e
        )

        return sendInapp(
            conn,
            m,
            `- ✨ Silakan pilih salah satu CN!\n\n${listText(results)}`
        )
    }
}

handler.command = ['cn']
handler.desc = 'Buat custom name dengan berbagai style'
handler.tags = ['tools']

export default handler