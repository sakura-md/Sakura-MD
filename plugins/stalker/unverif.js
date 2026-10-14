/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { pfxOf } from '../../lib/format.js'

import {
    parseUsername
} from '../../lib/tiktokinfo.js'

import {
    resolvePhone,
    findByTiktok,
    removeVerif
} from '../../lib/verifdb.js'

import logger from '../../lib/logger.js'
import { sendInapp } from '../../lib/inapp.js'


// ========================================================
// REACTION
// ========================================================

const react = async (conn, m, emoji) => {
    try {
        await conn.sendMessage(
            m.chat,
            {
                react: {
                    text: emoji,
                    key: m.key
                }
            }
        )
    } catch {}
}


// ========================================================
// HANDLER
// ========================================================

let handler = async (
    m,
    {
        conn,
        text,
        prefix
    }
) => {

    const pfx =
        pfxOf(prefix)


    // ====================================================
    // PARSE USERNAME
    // ====================================================

    const typed =
        parseUsername(
            text || ''
        )


    // ====================================================
    // USERNAME KOSONG
    // ====================================================

    if (!typed) {

        return await sendInapp(
            conn,
            m,
`Contoh:
${pfx}unverif @username`
        )
    }


    // ====================================================
    // CARI DATABASE
    // ====================================================

    const record =
        findByTiktok(
            typed
        )


    if (!record) {

        return await sendInapp(
            conn,
            m,
`- ❎ Username @${typed} tidak ditemukan di database verifikasi`
        )
    }


    // ====================================================
    // RESOLVE PHONE
    // ====================================================

    const phone =
        await resolvePhone(
            conn,
            m
        )


    // ====================================================
    // CEK MILIK SENDIRI
    // ====================================================

    const isSelf =
        record.jid === m.sender ||
        (
            !!phone &&
            record.phone === phone
        )


    // ====================================================
    // PERMISSION
    // ====================================================

    if (
        !isSelf &&
        !m.isOwner
    ) {

        return await sendInapp(
            conn,
            m,
`- ❎ Verifikasi @${typed} bukan milik kamu`
        )
    }


    // ====================================================
    // REMOVE
    // ====================================================

    const removed =
        removeVerif(
            record.jid
        )


    if (!removed) {

        return await sendInapp(
            conn,
            m,
`- ❎ Data verifikasi @${typed} tidak ditemukan`
        )
    }


    // ====================================================
    // REACTION
    // ====================================================

    await react(
        conn,
        m,
        '✅'
    )


    // ====================================================
    // LOGGER
    // ====================================================

    logger.info('[unverif]', `@${removed.tiktok} (${removed.phone || removed.jid}) oleh ${m.sender.split('@')[0]}`)


    // ====================================================
    // SUCCESS
    // ====================================================

    return await sendInapp(
        conn,
        m,
`- ✅ Verifikasi @${removed.tiktok} berhasil dihapus`
    )
}


handler.command = [
    'unverif',
    'unverifikasi'
]

handler.desc =
    'Hapus data verifikasi TikTok berdasarkan username'

handler.tags = [
    'stalker'
]

export default handler