/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { cmd } from '../../lib/plugkit.js'
import { pfxOf } from '../../lib/format.js'

import {
    MAX_TEMPLATES,
    MAX_ENTRY_LENGTH,
    charLength,
    getBioTemplates,
    hasCustomBio,
    setBioTemplates,
    resetBioTemplates,
    parseBioEntries,
    buildBioResults
} from '../../lib/biorules.js'


// =========================================================
// SAMPLE UNTUK PREVIEW
// =========================================================

const SAMPLE =
    'Sakura'

const preview =
    groupId =>
        buildBioResults(
            SAMPLE,
            groupId
        )
            .map(
                (r, i) =>
                    `${i + 1}. ${r}`
            )
            .join('\n\n')


// =========================================================
// HANDLER
// =========================================================

const handler = cmd({

    command: [
        'setbio'
    ],

    desc:
        'Atur template .bio khusus untuk grup ini',

    group: true,

    admin: true,

    tags: [
        'group'
    ],

    title:
        'Set Bio'

}, async (
    m,
    {
        text,
        prefix,
        notifReply
    }
) => {

    const pfx =
        pfxOf(prefix)

    const input =
        String(
            text || ''
        ).trim()

    const lower =
        input.toLowerCase()


    // =====================================================
    // HELP
    // =====================================================

    const help =
        `Contoh:\n` +
        `${pfx}setbio {bio} ✦ Sakura|『{bio}』|꒰ {bio} ꒱\n\n` +

        `• Pisahkan template dengan |\n` +
        `• Gunakan {bio} untuk posisi teks bio\n` +
        `• Jika tidak memakai {bio}, template ditempel di belakang bio\n` +
        `• Maksimal ${MAX_TEMPLATES} template\n` +
        `• Maksimal ${MAX_ENTRY_LENGTH} karakter per template\n\n` +

        `${pfx}setbio status  → lihat template grup ini\n` +
        `${pfx}setbio reset   → kembali ke default\n\n` +

        `Hasilnya dipakai ${pfx}bio <teks> di grup ini.`


    // =====================================================
    // TANPA INPUT
    // =====================================================

    if (!input) {

        return notifReply(
            help,
            'Set Bio'
        )
    }


    // =====================================================
    // STATUS
    // =====================================================

    if (
        [
            'status',
            'cek',
            'check',
            'list'
        ].includes(lower)
    ) {

        return notifReply(

            `Template BIO grup ini ` +
            `${hasCustomBio(m.chat) ? '(custom)' : '(default)'}:\n\n` +

            `${preview(m.chat)}\n\n` +

            `Coba:\n` +
            `${pfx}bio <teks>`,

            'Set Bio'
        )
    }


    // =====================================================
    // RESET
    // =====================================================

    if (
        [
            'reset',
            'default'
        ].includes(lower)
    ) {

        resetBioTemplates(
            m.chat
        )

        return notifReply(

            `Template BIO grup ini dikembalikan ke default:\n\n` +
            `${preview(m.chat)}`,

            'Set Bio'
        )
    }


    // =====================================================
    // PARSE
    // =====================================================

    const entries =
        parseBioEntries(
            input
        )

    if (!entries.length) {

        return notifReply(
            help,
            'Set Bio'
        )
    }


    // =====================================================
    // MAX TEMPLATE
    // =====================================================

    if (
        new Set(entries).size >
        MAX_TEMPLATES
    ) {

        return notifReply(

            `Maksimal ${MAX_TEMPLATES} template per grup`,

            'Set Bio'
        )
    }


    // =====================================================
    // MAX LENGTH
    // =====================================================

    const tooLong =
        entries.find(
            e =>
                charLength(e) >
                MAX_ENTRY_LENGTH
        )

    if (tooLong) {

        return notifReply(

            `Satu template maksimal ` +
            `${MAX_ENTRY_LENGTH} karakter ` +
            `("${tooLong}" = ${charLength(tooLong)}).`,

            'Set Bio'
        )
    }


    // =====================================================
    // SAVE
    // =====================================================

    let saved

    try {

        saved =
            setBioTemplates(
                m.chat,
                entries,
                m.sender
            )

    } catch (e) {

        return notifReply(

            `❌ Gagal menyimpan template BIO\n` +
            `${e?.message || e}`,

            'Set Bio'
        )
    }


    // =====================================================
    // BACA ULANG
    // =====================================================

    const used =
        getBioTemplates(
            m.chat
        )

    if (
        used.length !==
        saved.length
    ) {

        return notifReply(

            `Template tersimpan tetapi sebagian ` +
            `tidak terbaca. Coba gunakan template ` +
            `yang lebih pendek`,

            'Set Bio'
        )
    }


    // =====================================================
    // SUCCESS
    // =====================================================

    return notifReply(

        `✅ Template BIO grup ini disimpan ` +
        `(${saved.length}):\n\n` +

        `${preview(m.chat)}\n\n` +

        `Sekarang ${pfx}bio <teks> ` +
        `di grup ini memakai template tersebut.\n` +

        `Grup lain tidak terpengaruh.`,

        'Set Bio'
    )
})


export default handler