// =====================
// PLUGIN CUSTOM BIO
// =====================
// .bio <teks>
// -> menghasilkan beberapa template BIO
// -> setiap hasil memiliki tombol salin
//
// Template diambil dari .setbio per grup.
// Chat pribadi menggunakan template default.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import config from '../../config.js'

import {
    MAX_BIO_LENGTH,
    charLength,
    buildBioResults
} from '../../lib/biorules.js'


// =========================================================
// DATABASE
// =========================================================

const BIO_DB =
    path.join(
        path.dirname(
            fileURLToPath(
                import.meta.url
            )
        ),
        '../../database/bio.json'
    )


function readBioDB() {

    try {

        if (
            !fs.existsSync(
                BIO_DB
            )
        ) {
            return {}
        }

        const raw =
            fs.readFileSync(
                BIO_DB,
                'utf8'
            )

        return raw.trim()
            ? JSON.parse(raw)
            : {}

    } catch (e) {

        console.error(
            '[BIO] Error reading database:',
            e
        )

        return {}
    }
}


function saveBioDB(data) {

    try {

        fs.mkdirSync(
            path.dirname(BIO_DB),
            {
                recursive: true
            }
        )

        fs.writeFileSync(
            BIO_DB,
            JSON.stringify(
                data,
                null,
                2
            )
        )

        return true

    } catch (e) {

        console.error(
            '[BIO] Error saving database:',
            e
        )

        return false
    }
}


// =========================================================
// LIST TEXT
// =========================================================

const listText =
    results =>
        results
            .map(
                (r, i) =>
                    `${i + 1}. ${r}`
            )
            .join('\n\n')


// =========================================================
// SEND BUTTONS
// =========================================================

async function sendBioButtons(
    conn,
    m,
    results
) {

    const templateButtons =
        results.map(
            (result, i) => ({

                index:
                    i + 1,

                displayText:
                    result,

                id:
                    `bio_${i + 1}`,

                copy_code:
                    result
            })
        )


    return conn.sendMessage(
        m.chat,
        {

            text:
                `- ✦ *PENCET SALAH SATU TOMBOL* ✦`,

            footer:
                config.botName,

            templateButtons,

            templateMode:
                'native'

        },
        {
            quoted: m
        }
    )
}


// =========================================================
// HANDLER
// =========================================================

let handler =
    async (
        m,
        {
            conn,
            text
        }
    ) => {

        const bio =
            String(
                text || ''
            ).trim()


        // =================================================
        // EMPTY
        // =================================================

        if (!bio) {

            return conn.sendMessage(
                m.chat,
                {
                    text:
                        `✨ Contoh:\n` +
                        `.bio Sakura`
                },
                {
                    quoted: m
                }
            )
        }


        // =================================================
        // MAX LENGTH INPUT
        // =================================================

        if (
            charLength(bio) >
            MAX_BIO_LENGTH
        ) {

            return conn.sendMessage(
                m.chat,
                {
                    text:
                        `❌ Bio terlalu panjang.\n` +
                        `Maksimal ${MAX_BIO_LENGTH} karakter`
                },
                {
                    quoted: m
                }
            )
        }


        // =================================================
        // BUILD RESULT
        // =================================================

        const results =
            buildBioResults(
                bio,
                m.isGroup
                    ? m.chat
                    : ''
            )


        if (!results.length) {

            return conn.sendMessage(
                m.chat,
                {
                    text:
                        `❌ Tidak ada template BIO yang dapat digunakan.`
                },
                {
                    quoted: m
                }
            )
        }


        // =================================================
        // SAVE DATABASE
        // =================================================

        const db =
            readBioDB()


        db[m.sender] = {

            bio,

            templates:
                Object.fromEntries(
                    results.map(
                        (r, i) =>
                            [
                                i + 1,
                                r
                            ]
                    )
                ),

            timestamp:
                new Date()
                    .toLocaleString(
                        'id-ID'
                    ),

            pushname:
                m.pushName ||
                db[m.sender]?.pushname ||
                'Unknown'
        }


        if (
            !saveBioDB(db)
        ) {

            return conn.sendMessage(
                m.chat,
                {
                    text:
                        `❌ Gagal menyimpan data BIO.`
                },
                {
                    quoted: m
                }
            )
        }


        // =================================================
        // SEND
        // =================================================

        try {

            await sendBioButtons(
                conn,
                m,
                results
            )

        } catch (e) {

            console.error(
                '[BIO] tombol salin gagal:',
                e
            )

            return conn.sendMessage(
                m.chat,
                {
                    text:
                        `✨ Silakan pilih salah satu\n\n` +
                        `${listText(results)}`
                },
                {
                    quoted: m
                }
            )
        }
    }


// =========================================================
// COMMAND
// =========================================================

handler.command = [
    'bio'
]

handler.desc =
    'Buat custom bio dengan berbagai template'

handler.tags = [
    'tools'
]


export default handler