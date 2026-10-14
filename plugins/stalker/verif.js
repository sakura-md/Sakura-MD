import { pfxOf } from '../../lib/format.js'
import { getTikTokUser, parseUsername, exact } from '../../lib/tiktokinfo.js'
import { sendInapp } from '../../lib/inapp.js'
import { react } from '../../lib/plugkit.js'
import { resolvePhone, findByJid, findByTiktok, saveVerif, removeVerif } from '../../lib/verifdb.js'
import { getVerifRule, checkNickname, ruleText } from '../../lib/verifrules.js'

const getRuleForMessage = m => getVerifRule(m.isGroup ? m.chat : '')

const usage = (prefix = '.') => `Gunakan:\n${pfxOf(prefix)}verif @username`

const handler = async (m, { conn, text, prefix }) => {
    const input = String(text || '').trim()
    if (!input) return sendInapp(conn, m, usage(prefix))

    const username = parseUsername(input)
    if (!username) return sendInapp(conn, m, usage(prefix))

    const rule = getRuleForMessage(m)
    await react(conn, m, '⏳')

    try {
        const u = await getTikTokUser(username)
        const nick = String(u.nickname || '').trim()
        const check = checkNickname(nick, rule)

        if (!check.ok) {
            await react(conn, m, '❎')
            const requirement = rule.enabled === false
                ? 'Aturan nickname sedang OFF.'
                : `Nickname harus mengandung ${rule.mode === 'all' ? 'semua' : 'salah satu'} dari: ${rule.tags.join(rule.mode === 'all' ? ' dan ' : ' atau ')}`
            return sendInapp(
                conn,
                m,
                `❎ Verifikasi gagal!\n\nNickname TikTok: ${nick || '-'}\n${requirement}`
            )
        }

        const phone = await resolvePhone(conn, m)
        const sender = conn.decodeJid?.(m.sender) || m.sender

        // Data verif milik pengirim sendiri (cocok lewat jid ATAU nomor), dan pemilik username yang diminta
        const mine = findByJid(sender, phone) || findByJid(m.sender, phone)
        const owned = findByTiktok(u.username)

        // Hanya ditolak kalau username itu dipakai orang LAIN. Kalau milik sendiri, boleh verif ulang / ganti akun.
        const ownedByMe = !!owned && (
            owned.jid === sender ||
            owned.jid === m.sender ||
            (!!mine && owned.jid === mine.jid) ||
            (!!phone && owned.phone === phone)
        )
        if (owned && !ownedByMe && !m.isOwner) {
            await react(conn, m, '❎')
            return sendInapp(conn, m, `❎ Akun @${u.username} sudah terverifikasi oleh nomor lain.`)
        }

        // Sudah pernah daftar -> data lama diganti otomatis (tidak perlu .unverif dulu)
        if (mine && mine.jid !== sender) removeVerif(mine.jid)

        saveVerif({
            jid: sender,
            phone,
            waName: m.pushName,
            tiktok: u.username,
            nickname: u.nickname
        })

        await react(conn, m, '✅')
        return sendInapp(
            conn,
            m,
            `✅ ${mine ? 'Verifikasi diperbarui!' : 'Verifikasi berhasil!'}\n\n${u.nickname || '-'}\n@${u.username}\n\nPengikut: ${exact(u.followers)}\nMengikuti: ${exact(u.following)}\nTotal suka: ${exact(u.likes)}`
        )
    } catch (e) {
        await react(conn, m, '❎')
        const msg = e?.code === 'NOT_FOUND'
            ? `❎ Akun TikTok @${username} tidak ditemukan.`
            : '❎ Gagal mengambil data TikTok. Coba lagi beberapa saat.'
        return sendInapp(conn, m, msg)
    }
}

handler.command = ['verif', 'verifikasi']
handler.desc = 'Verifikasi akun TikTok sesuai aturan nickname grup'
handler.tags = ['stalker']

export default handler