/*
  Installer VPS via WhatsApp — jalankan script lewat SSH ke VPS target.
  Khusus Owner. Gunakan di chat pribadi (ada password).
*/
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runScript, renderTemplate, parseTarget, isSafe, randomPass } from '../../../lib/sshrun.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.join(__dirname, 'install-panel.sh')
const TITLE = 'Install Panel'
const busy = new Set()

let handler = async (m, { conn, text, prefix, command, notifReply }) => {
    const pfx = prefix || '.'
    if (m.isGroup) return notifReply('Pakai di chat pribadi, karena ada password.', TITLE)

    const [target, rootPass, fqdn, email, adminUser, adminPassIn] = text.split('|').map(s => s.trim())
    if (!target || !rootPass || !fqdn || !email) {
        return notifReply(
            `Cara pakai:\n${pfx}${command} ip|passroot|domain|email|userAdmin|passAdmin\n\n` +
            `Contoh:\n${pfx}${command} 1.2.3.4|RootPass123|panel.domain.com|me@mail.com|admin|AdminPass123\n\n` +
            `• ip bisa pakai port: 1.2.3.4:2222\n• userAdmin & passAdmin boleh dikosongkan (pass dibuat acak)\n` +
            `• Domain harus sudah diarahkan (A record) ke IP VPS\n• OS VPS: Ubuntu 22.04/24.04 atau Debian 12`,
            TITLE
        )
    }

    const t = parseTarget(target)
    if (!t) return notifReply('Format IP/host salah.', TITLE)
    const user = adminUser || 'admin'
    const adminPass = adminPassIn || randomPass()
    if (!/^[A-Za-z0-9.-]+$/.test(fqdn)) return notifReply('Domain tidak valid.', TITLE)
    for (const [label, v] of [['Email', email], ['User admin', user], ['Password admin', adminPass]]) {
        if (!isSafe(v)) return notifReply(`${label} hanya boleh huruf, angka, dan . _ @ % + = : , -`, TITLE)
    }

    const key = `${t.host}:${t.port}`
    if (busy.has(key)) return notifReply('VPS ini sedang diproses, tunggu sampai selesai.', TITLE)
    busy.add(key)

    // Coba hapus pesan berisi password (hanya berhasil kalau bot punya hak)
    conn.sendMessage(m.chat, { delete: m.key }).catch(() => {})

    const dbPass = randomPass()
    const secrets = [rootPass, adminPass, dbPass]
    try {
        const script = renderTemplate(SCRIPT, {
            FQDN: fqdn, ADMIN_EMAIL: email, ADMIN_USER: user, ADMIN_PASS: adminPass, DB_PASS: dbPass
        })
        await notifReply(`Mulai install panel di ${t.host}.\nProses 10-20 menit, progres dikirim di sini.`, TITLE)

        const r = await runScript({ ...t, password: rootPass }, script, {
            secrets,
            okMarker: 'INSTALL_OK',
            onStep: line => notifReply(line.replace(/^>> /, '⏳ '), TITLE)
        })

        if (!r.ok) {
            const tail = r.output.trim().split('\n').slice(-15).join('\n')
            return notifReply(`❌ Install gagal (exit ${r.code}).\n\n${tail}`, TITLE)
        }
        const url = r.marker.replace('INSTALL_OK', '').trim()
        await notifReply(
            `✅ Panel terpasang!\n\n🌐 ${url}\n👤 Username: ${user}\n📧 Email: ${email}\n🔑 Password: ${adminPass}\n\n` +
            `Selanjutnya buat Location & Node di panel, lalu pakai ${pfx}setupwings.\n` +
            (url.startsWith('http://') ? '\n⚠️ SSL gagal; cek DNS domain lalu jalankan certbot manual.' : ''),
            TITLE
        )
    } catch (e) {
        console.error('[installpanel]', e)
        await notifReply(`❌ ${e.message}`, TITLE)
    } finally {
        busy.delete(key)
    }
}

handler.command = ['installpanel', 'instalpanel']
handler.desc = 'Install Pterodactyl Panel ke VPS'
handler.tags = ['installer']
handler.owner = true

export default handler
