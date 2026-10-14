/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { cmd } from '../../lib/plugkit.js'
import { getVerifRule, setVerifRule, resetVerifRule, ruleText } from '../../lib/verifrules.js'
import { pfxOf } from '../../lib/format.js'

const splitTags = value => [...new Set(
    String(value || '')
        .split('|')
        .map(v => v.trim())
        .filter(Boolean)
)]

const render = rule => {
    if (rule.enabled === false) return 'Aturan Verif: OFF'
    return `Aturan Verif: ${rule.mode === 'all' ? 'semua kata' : 'salah satu kata'}\n${ruleText(rule)}`
}

const handler = cmd({
    command: ['setverif', 'verifrule'],
    desc: 'Atur syarat nickname untuk verifikasi TikTok',
    group: true,
    admin: true,
    tags: ['group'],
    title: 'Aturan Verif'
}, async (m, { args, text, prefix, notifReply }) => {
    const input = String(text || '').trim()
    const current = getVerifRule(m.chat)

    if (!input || ['status', 'cek', 'check'].includes(input.toLowerCase())) {
        return notifReply(
            `Contoh:\n${pfxOf(prefix)}setverif Fushiguro|FSR\n${pfxOf(prefix)}setverif all Fushiguro|FSR\n${pfxOf(prefix)}setverif off\n${pfxOf(prefix)}setverif reset`,
            'Aturan Verif'
        )
    }

    const lower = input.toLowerCase()
    if (lower === 'off') {
        setVerifRule(m.chat, { ...current, enabled: false })
        return notifReply('Aturan Verif dimatikan untuk grup ini', 'Aturan Verif')
    }

    if (lower === 'reset' || lower === 'default') {
        resetVerifRule(m.chat)
        return notifReply('Aturan Verif dikembalikan ke default', 'Aturan Verif')
    }

    let mode = current.mode
    let value = input
    if (/^all\s+/i.test(value)) {
        mode = 'all'
        value = value.replace(/^all\s+/i, '').trim()
    } else if (/^any\s+/i.test(value)) {
        mode = 'any'
        value = value.replace(/^any\s+/i, '').trim()
    }

    const tags = splitTags(value)
    if (!tags.length || tags.some(v => v.length > 80) || tags.length > 10) {
        return notifReply(
            `Format aturan tidak valid.\nGunakan kata yang dipisahkan dengan |\nContoh: ${pfxOf(prefix)}setverif Fushiguro|FSR`,
            'Aturan Verif'
        )
    }

    setVerifRule(m.chat, { enabled: true, mode, tags })
    return notifReply('Aturan Verif berhasil disimpan', 'Aturan Verif')
})

export default handler