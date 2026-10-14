/*
  Installer VPS via WhatsApp — jalankan script lewat SSH ke VPS target.
  Khusus Owner. Gunakan di chat pribadi (ada password).
*/
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runScript, parseTarget } from '../../../lib/sshrun.js'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.join(__dirname, 'uninstall-panel.sh')
const TITLE = 'Uninstall Panel'
const busy = new Set()

let handler = async (m, { conn, text, prefix, command, notifReply }) => {
    const pfx = prefix || '.'
    if (m.isGroup) return notifReply('Pakai di chat pribadi, karena ada password.', TITLE)

    const [target, rootPass, confirm] = text.split('|').map(s => s.trim())
    if (!target || !rootPass) {
        return notifReply(
            `Cara pakai:\n${pfx}${command} ip|passroot|HAPUS\n\n` +
            `⚠️ Menghapus Panel, database panel, config Wings, dan /var/lib/pterodactyl (data server). ` +
            `Tidak bisa dibatalkan. Container Docker lain tidak disentuh.`,
            TITLE
        )
    }
    if (confirm !== 'HAPUS') return notifReply(`Tambahkan konfirmasi di akhir: ${pfx}${command} ip|passroot|HAPUS`, TITLE)

    const t = parseTarget(target)
    if (!t) return notifReply('Format IP/host salah.', TITLE)
    const key = `${t.host}:${t.port}`
    if (busy.has(key)) return notifReply('VPS ini sedang diproses, tunggu sampai selesai.', TITLE)
    busy.add(key)
    conn.sendMessage(m.chat, { delete: m.key }).catch(() => {})

    try {
        await notifReply(`Menghapus Panel + Wings di ${t.host}...`, TITLE)
        const r = await runScript({ ...t, password: rootPass }, fs.readFileSync(SCRIPT, 'utf8'), {
            secrets: [rootPass],
            okMarker: 'UNINSTALL_OK',
            timeoutMs: 10 * 60 * 1000,
            onStep: line => notifReply(line.replace(/^>> /, '⏳ '), TITLE)
        })
        if (!r.ok) {
            const tail = r.output.trim().split('\n').slice(-15).join('\n')
            return notifReply(`❌ Uninstall gagal (exit ${r.code}).\n\n${tail}`, TITLE)
        }
        await notifReply('✅ Panel + Wings sudah dihapus dari VPS.', TITLE)
    } catch (e) {
        console.error('[uninstallpanel]', e)
        await notifReply(`❌ ${e.message}`, TITLE)
    } finally {
        busy.delete(key)
    }
}

handler.command = ['uninstallpanel', 'hapuspanel']
handler.desc = 'Hapus Panel + Wings dari VPS'
handler.tags = ['installer']
handler.owner = true

export default handler
