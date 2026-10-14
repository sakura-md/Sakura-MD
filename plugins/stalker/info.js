/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import sharp from 'sharp'
import config from '../../config.js'
import { pfxOf } from '../../lib/format.js'
import { getThumb } from '../../lib/wa.js'

import {
    getTikTokUser,
    getAvatarSquare,
    compact,
    exact,
    agoText
} from '../../lib/tiktokinfo.js'

import logger from '../../lib/logger.js'

import {
    resolvePhone,
    findByJid
} from '../../lib/verifdb.js'


/* =========================================================
 * REACTION
 * ========================================================= */

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


/* =========================================================
 * NORMALISASI GAMBAR
 * ========================================================= */

const makeSquare1080 = async (buffer) => {

    if (
        !buffer ||
        !Buffer.isBuffer(buffer) ||
        !buffer.length
    ) {
        return Buffer.alloc(0)
    }

    try {

        return await sharp(buffer)
            .resize(1080, 1080, {
                fit: 'contain',
                background: {
                    r: 20,
                    g: 20,
                    b: 20,
                    alpha: 1
                }
            })
            .jpeg({
                quality: 92,
                chromaSubsampling: '4:4:4'
            })
            .toBuffer()

    } catch (e) {

        logger.warn(
            `[info] resize avatar gagal: ${e?.message || e}`
        )

        return buffer
    }
}


/* =========================================================
 * BUILD TEXT
 * ========================================================= */

const buildText = (u) => {

    const likes =
        Number(u.likes) || 0

    const videos =
        Number(u.videos) || 0

    const rasioAkun =
        videos > 0
            ? (likes / videos).toFixed(1)
            : 0

    const er =
        videos > 0
            ? ((likes / videos) / 10).toFixed(2)
            : 0

    return `*「𝗜𝗡𝗙𝗢 𝗔𝗞𝗨𝗡 𝗧𝗜𝗞𝗧𝗢𝗞」*

- ۶ৎ  Nickname : *${u.nickname || '-'}*
- ۶ৎ  Username : *@${u.username || '-'}*
- ۶ৎ  Bio : ${u.bio || '-'}

- ۶ৎ  Status : *${u.private ? '🔒 Private' : '✅ Publik'}*
- ۶ৎ  Verifikasi : *${u.verified ? '✅ Ya' : '❌ Tidak'}*
- ۶ৎ  Wilayah : *${u.region ? String(u.region).toUpperCase() : '-'}*
- ۶ৎ  Afiliasi : *${u.seller ? '🛒 Seller' : '❌ Tidak'}*

- ۶ৎ  Total Suka : *${compact(u.likes)} (${exact(u.likes)})*
- ۶ৎ  Pengikut : *${compact(u.followers)} (${exact(u.followers)})*
- ۶ৎ  Mengikuti : *${compact(u.following)} (${exact(u.following)})*
- ۶ৎ  Total Teman : *${exact(u.friends)} teman*
- ۶ৎ  Total Video : *${exact(u.videos)} video*

- ۶ৎ  Rasio Akun : *${rasioAkun} suka / video*
- ۶ৎ  Rasio Suka (ER) : *${er}%*

- ۶ৎ  Nickname terakhir kali diubah : *${agoText(u.nickModifyTime)}*
- ۶ৎ  Akun ini telah dibuat selama : *${agoText(u.createTime)}*`
}

const sendRichInfo = async (
    conn,
    m,
    avatar,
    body,
    u
) => {

    const link =
        String(
            u.link ||
            `https://www.tiktok.com/@${u.username}`
        ).trim()

    const nickname =
        String(
            u.nickname ||
            `@${u.username || 'TikTok'}`
        )
            .trim()

    const displayText =
        `Lihat Profil ${nickname}`
            .slice(0, 25)

    await conn.sendMessage(
        m.chat,
        {
            image: avatar,
            caption: body,
            footer: config.botName,

            templateButtons: [
                {
                    index: 1,
                    displayText,
                    id: 'tiktok_profile',
                    url: link
                }
            ],

            templateMode: 'native'
        },
        {
            quoted: m
        }
    )

    return true
}


/* =========================================================
 * HANDLER
 * ========================================================= */

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


    /* =====================================================
     * HANYA COMMAND .INFO
     *
     * TIDAK MENERIMA:
     * .info @username
     * .info username
     * reply lalu .info
     * mention lalu .info
     *
     * INFO HANYA UNTUK AKUN YANG SUDAH VERIF.
     * ===================================================== */

    if (text?.trim()) {

        await react(
            conn,
            m,
            '❌'
        )

        return conn.sendMessage(
            m.chat,
            {
                text:
                    `❌ Command ${pfx}info tidak menerima username.\n\n` +
                    `Gunakan:\n` +
                    `${pfx}info`
            },
            {
                quoted: m
            }
        )
    }


    /* =====================================================
     * CEK VERIFIKASI
     * ===================================================== */

    const senderPhone =
        await resolvePhone(
            conn,
            m
        )

    const decodedSender =
        conn.decodeJid?.(m.sender) ||
        m.sender

    const senderRecord =
        findByJid(
            decodedSender,
            senderPhone
        )


    /* =====================================================
     * BELUM VERIF
     * ===================================================== */

    if (!senderRecord) {

        await react(
            conn,
            m,
            '❌'
        )

        return conn.sendMessage(
            m.chat,
            {
                text:
                    `Silakan verifikasi akun TikTok kamu terlebih dahulu!\n\n` +
                    `Contoh:\n` +
                    `${pfx}verif @username`
            },
            {
                quoted: m
            }
        )
    }


    /* =====================================================
     * AMBIL USERNAME DARI DATABASE VERIF
     * ===================================================== */

    const username =
        String(
            senderRecord.tiktok ||
            senderRecord.username ||
            ''
        )
            .replace(/^@/, '')
            .trim()


    /* =====================================================
     * DATA TIKTOK TIDAK ADA
     * ===================================================== */

    if (!username) {

        await react(
            conn,
            m,
            '❌'
        )

        return conn.sendMessage(
            m.chat,
            {
                text:
                    `❌ Data akun TikTok kamu tidak ditemukan.\n\n` +
                    `Silakan lakukan verifikasi ulang dengan:\n` +
                    `${pfx}verif @username`
            },
            {
                quoted: m
            }
        )
    }


    /* =====================================================
     * LOADING
     * ===================================================== */

    await react(
        conn,
        m,
        '🔄'
    )


    /* =====================================================
     * AMBIL DATA TIKTOK
     * ===================================================== */

    let u

    try {

        u =
            await getTikTokUser(
                username
            )

    } catch (e) {

        await react(
            conn,
            m,
            '❎'
        )

        logger.warn(
            `[info] @${username}: ${e?.message || e}`
        )

        return conn.sendMessage(
            m.chat,
            {
                text:
                    e?.code === 'NOT_FOUND'
                        ? `❎ Akun TikTok @${username} tidak ditemukan.`
                        : `❎ Gagal mengambil data TikTok, coba lagi nanti.`
            },
            {
                quoted: m
            }
        )
    }


    /* =====================================================
     * BUILD BODY
     * ===================================================== */

    const body =
        buildText(u)


    /* =====================================================
     * AMBIL AVATAR
     * ===================================================== */

    let avatar =
        Buffer.alloc(0)

    try {

        if (u.avatar) {

            avatar =
                await getAvatarSquare(
                    u.avatar,
                    1080
                )
        }

    } catch (e) {

        logger.warn(
            `[info] avatar utama gagal: ${e?.message || e}`
        )

        avatar =
            Buffer.alloc(0)
    }


    /* =====================================================
     * FALLBACK THUMB
     * ===================================================== */

    if (
        !avatar ||
        !avatar.length
    ) {

        try {

            avatar =
                await getThumb(
                    'thumb.jpg'
                )

            if (
                avatar &&
                avatar.length
            ) {

                avatar =
                    await makeSquare1080(
                        avatar
                    )
            }

        } catch (e) {

            logger.warn(
                `[info] fallback thumb gagal: ${e?.message || e}`
            )

            avatar =
                Buffer.alloc(0)
        }
    }


    /* =====================================================
     * KIRIM RICH INFO
     * ===================================================== */

    let richSent = false

    if (
        avatar &&
        avatar.length
    ) {

        try {

            await sendRichInfo(
                conn,
                m,
                avatar,
                body,
                u
            )

            richSent = true

        } catch (e) {

            logger.warn(
                `[info] richMessage gagal: ${e?.message || e}`
            )
        }
    }


    /* =====================================================
     * BERHASIL
     * ===================================================== */

    if (richSent) {

        await react(
            conn,
            m,
            '✅'
        )

        logger.info(
            '[info]',
            `@${u.username} (${u.nickname})`
        )

        return
    }


    /* =====================================================
     * FALLBACK TANPA GAMBAR
     * ===================================================== */

    try {

        await conn.sendMessage(
            m.chat,
            {
                text:
                    `${body}\n\n🔗 ${u.link || `https://www.tiktok.com/@${u.username}`}`
            },
            {
                quoted: m
            }
        )

        await react(
            conn,
            m,
            '✅'
        )

        logger.info(
            '[info]',
            `@${u.username} (${u.nickname})`
        )

    } catch (e) {

        await react(
            conn,
            m,
            '❎'
        )

        logger.error(
            `[info] semua fallback gagal: ${e?.message || e}`
        )
    }
}


/* =========================================================
 * COMMAND
 * ========================================================= */

handler.command = [
    'info'
]

handler.desc =
    'Info lengkap akun TikTok yang telah diverifikasi'

handler.tags = [
    'stalker'
]


export default handler