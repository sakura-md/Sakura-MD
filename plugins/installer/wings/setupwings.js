/*
  Installer VPS via WhatsApp — jalankan script lewat SSH ke VPS target.
  Khusus Owner. Gunakan di chat pribadi (ada password).
*/
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runScript, renderTemplate, parseTarget } from '../../../lib/sshrun.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.join(__dirname, 'setup-wings.sh')
const TITLE = 'Setup Wings'
const busy = new Set()

let handler = async (m, { conn, prefix, command, notifReply }) => {
    const pfx = prefix || '.'
    if (m.isGroup) return notifReply('Pakai di chat pribadi, karena ada password.', TITLE)

    // Baris pertama: ip|passroot. Config: baris berikutnya, atau balas pesan berisi config.yml
    const raw = String(m.text || '')
    const nl = raw.indexOf('\n')
    const first = (nl === -1 ? raw : raw.slice(0, nl)).replace(/^\S+\s*/, '').trim()
    let config = (nl === -1 ? '' : raw.slice(nl + 1)).trim() || (m.quoted?.text || '').trim()
    const [target, rootPass] = first.split('|').map(s => s.trim())

    if (!target || !rootPass || !config) {
        return notifReply(
            `Cara pakai:\n${pfx}${command} ip|passroot\n<tempel isi config.yml di baris baru>\n\n` +
            `atau balas pesan berisi config.yml dengan:\n${pfx}${command} ip|passroot\n\n` +
            `Config diambil dari panel: Admin → Nodes → pilih node → tab Configuration.`,
            TITLE
        )
    }
    config = config.replace(/^```(?:ya?ml)?\n?/i, '').replace(/```$/, '').trim()
    if (!/^\s*(debug|uuid|token_id|token|api|system|remote)\s*:/m.test(config)) {
        return notifReply('Isi itu tidak terlihat seperti config.yml Wings (harus ada uuid, token, remote).', TITLE)
    }

    const t = parseTarget(target)
    if (!t) return notifReply('Format IP/host salah.', TITLE)
    const key = `${t.host}:${t.port}`
    if (busy.has(key)) return notifReply('VPS ini sedang diproses, tunggu sampai selesai.', TITLE)
    busy.add(key)
    conn.sendMessage(m.chat, { delete: m.key }).catch(() => {})

    try {
        const b64 = Buffer.from(config + '\n', 'utf8').toString('base64')
        const script = renderTemplate(SCRIPT, { CONFIG_B64: b64 })
        await notifReply(`Mulai setup Wings di ${t.host}...`, TITLE)
        const r = await runScript({ ...t, password: rootPass }, script, {
            secrets: [rootPass, b64],
            okMarker: 'WINGS_OK',
            onStep: line => notifReply(line.replace(/^>> /, '⏳ '), TITLE)
        })
        if (!r.ok) {
            const tail = r.output.trim().split('\n').slice(-15).join('\n')
            return notifReply(`❌ Setup Wings gagal (exit ${r.code}).\n\n${tail}`, TITLE)
        }
        await notifReply('✅ Wings aktif. Cek node di panel, harusnya sudah berstatus hijau (heartbeat).', TITLE)
    } catch (e) {
        console.error('[setupwings]', e)
        await notifReply(`❌ ${e.message}`, TITLE)
    } finally {
        busy.delete(key)
    }
}

handler.command = ['setupwings', 'installwings']
handler.desc = 'Install Docker + Wings & hubungkan ke panel'
handler.tags = ['installer']
handler.owner = true

export default handler
