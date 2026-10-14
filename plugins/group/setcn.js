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
    getCnTemplates,
    hasCustomCn,
    setCnTemplates,
    resetCnTemplates,
    parseEntries,
    buildCnResults
} from '../../lib/cnrules.js'

// Contoh nama untuk preview. Hasilnya dibuat oleh fungsi yang SAMA dengan .cn.
const SAMPLE = 'Nama'
const preview = groupId => buildCnResults(SAMPLE, groupId).map((r, i) => `${i + 1}. ${r}`).join('\n')

const handler = cmd({
    command: ['setcn'],
    desc: 'Atur template .cn khusus untuk grup ini',
    group: true,
    admin: true,
    tags: ['group'],
    title: 'Set CN'
}, async (m, { text, prefix, notifReply }) => {
    const pfx = pfxOf(prefix)
    const input = String(text || '').trim()
    const lower = input.toLowerCase()

    const help =
        `Contoh:\n` +
        `${pfx}setcn Fushiguro|〆FSR|{nama} ft FSR\n\n` +
        `• Pisahkan tiap template dengan |\n` +
        `• Teks biasa ditempel di belakang nama\n` +
        `• Pakai {nama} kalau mau atur posisi / spasi\n` +
        `• Maksimal ${MAX_TEMPLATES} template, ${MAX_ENTRY_LENGTH} karakter per template\n\n` +
        `${pfx}setcn status  → lihat template grup ini\n` +
        `${pfx}setcn reset   → kembali ke default\n\n` +
        `Hasilnya dipakai ${pfx}cn <nama> di grup ini.`

    if (!input) return notifReply(help, 'Set CN')

    if (['status', 'cek', 'check', 'list'].includes(lower)) {
        return notifReply(
            `Template CN grup ini ${hasCustomCn(m.chat) ? '(custom)' : '(default)'}:\n\n${preview(m.chat)}\n\n` +
            `Coba: ${pfx}cn <nama>`,
            'Set CN'
        )
    }

    if (['reset', 'default'].includes(lower)) {
        resetCnTemplates(m.chat)
        return notifReply(`Template CN grup ini dikembalikan ke default:\n\n${preview(m.chat)}`, 'Set CN')
    }

    const entries = parseEntries(input)
    if (!entries.length) return notifReply(help, 'Set CN')

    // validasi dilakukan pada hasil akhir (setelah dipercantik) dengan hitungan yang SAMA seperti penyimpanan,
    // jadi tidak ada template yang "tersimpan" tapi diam-diam dibuang saat .cn dipakai
    if (new Set(entries).size > MAX_TEMPLATES) {
        return notifReply(`Maksimal ${MAX_TEMPLATES} template per grup.`, 'Set CN')
    }
    const tooLong = entries.find(e => charLength(e) > MAX_ENTRY_LENGTH)
    if (tooLong) {
        return notifReply(`Satu template maksimal ${MAX_ENTRY_LENGTH} karakter (“${tooLong}” = ${charLength(tooLong)}).`, 'Set CN')
    }

    const saved = setCnTemplates(m.chat, entries, m.sender)
    // baca ulang lewat jalur yang sama dengan .cn untuk memastikan yang tampil = yang akan dipakai
    const used = getCnTemplates(m.chat)
    if (used.length !== saved.length) {
        return notifReply('Template tersimpan tapi sebagian tidak terbaca, coba ulangi dengan template lebih pendek.', 'Set CN')
    }

    return notifReply(
        `✅ Template CN grup ini disimpan (${saved.length}):\n\n${preview(m.chat)}\n\n` +
        `Sekarang ${pfx}cn <nama> di grup ini memakai template tersebut. Grup lain tidak terpengaruh.`,
        'Set CN'
    )
})

export default handler
