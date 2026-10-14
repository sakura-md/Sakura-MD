/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { reloadPlugin, unloadPlugin } from '../../handler.js'
import { resolvePluginPath } from '../../lib/pluginpath.js'
import { sendInapp } from '../../lib/inapp.js'

function cleanCode(text) {
    let code = String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/^\uFEFF/, '')
        .trim()

    const fence = code.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n?```$/)

    if (fence) code = fence[1]

    return code.endsWith('\n') ? code : `${code}\n`
}

function checkSyntax(code) {
    const tmp = path.join(
        os.tmpdir(),
        `sakura-check-${process.pid}-${Date.now()}.mjs`
    )

    try {
        fs.writeFileSync(tmp, code, 'utf8')

        const res = spawnSync(
            process.execPath,
            ['--check', tmp],
            {
                encoding: 'utf8',
                timeout: 15000
            }
        )

        if (res.status === 0) return null

        return String(
            res.stderr ||
            res.stdout ||
            res.error?.message ||
            'Syntax error'
        )
            .split(tmp)
            .join('plugin.js')
            .split('\n')
            .filter(Boolean)
            .slice(0, 8)
            .join('\n')
    } finally {
        try {
            fs.unlinkSync(tmp)
        } catch {}
    }
}

let handler = async (m, { conn, args, prefix }) => {
    const pfx = prefix || '.'

    const reply = async text => {
        return sendInapp(conn, m, text)
    }

    const target = args[0]

    if (!target) {
        return reply(
            `- *Contoh:*\n${pfx}addplugin plugins/folder/file.js\n<kode plugin>`
        )
    }

    const resolved = resolvePluginPath(target)

    if (!resolved.ok) {
        return reply(resolved.error)
    }

    let code = ''

    // Mode reply
    if (m.quoted?.text?.trim()) {
        code = m.quoted.text
    } else {
        /*
         * Mode langsung:
         *
         * .addplugin plugins/folder/file.js
         * <kode plugin>
         */
        const raw = String(m.text || '')
        const escapedPrefix = pfx.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        )

        code = raw.replace(
            new RegExp(
                `^${escapedPrefix}addplugin\\s+\\S+\\s*`,
                'i'
            ),
            ''
        )
    }

    code = cleanCode(code)

    if (!code.trim()) {
        return reply(
            `- *Contoh:*\n${pfx}addplugin plugins/folder/file.js\n<kode plugin>`
        )
    }

    const maxBytes =
        (global.config?.limits?.maxPluginKB ?? 512) * 1024

    if (Buffer.byteLength(code, 'utf8') > maxBytes) {
        return reply('❌ Kode plugin terlalu besar.')
    }

    const syntaxError = checkSyntax(code)

    if (syntaxError) {
        return reply(
            `❌ Syntax error:\n\n${syntaxError}`
        )
    }

    const { abs, rel } = resolved

    const existed = fs.existsSync(abs)
    const backup = existed
        ? fs.readFileSync(abs, 'utf8')
        : null

    try {
        fs.mkdirSync(
            path.dirname(abs),
            { recursive: true }
        )

        const tmp = `${abs}.tmp-${Date.now()}`

        fs.writeFileSync(
            tmp,
            code,
            'utf8'
        )

        fs.renameSync(tmp, abs)
    } catch (e) {
        console.error('[addplugin] write error:', e)

        return reply(
            `❌ Gagal menyimpan plugin:\n${e.message}`
        )
    }

    const result = await reloadPlugin(abs)

    if (!result.ok) {
        try {
            if (existed) {
                fs.writeFileSync(
                    abs,
                    backup,
                    'utf8'
                )

                await reloadPlugin(abs)
            } else {
                unloadPlugin(abs)

                if (fs.existsSync(abs)) {
                    fs.unlinkSync(abs)
                }
            }
        } catch (e) {
            console.error('[addplugin] rollback error:', e)
        }

        return reply(
            `❌ Plugin gagal di-load dan perubahan dibatalkan.\n\n` +
            `${String(
                result.error?.message ||
                result.error ||
                'Unknown error'
            ).slice(0, 500)}`
        )
    }

    const commands = result.commands
        .filter(c => typeof c === 'string')
        .map(c => `${pfx}${c}`)
        .join(', ') || '-'

    return reply(
        `✅ Plugin ${existed ? 'diperbarui' : 'dibuat'}.\n` +
        `📁 ${rel}\n` +
        `🔌 Command: ${commands}\n` +
        `♻️ Aktif tanpa restart.`
    )
}

handler.command = ['addplugin']
handler.desc = 'Buat atau update plugin'
handler.owner = true

export default handler