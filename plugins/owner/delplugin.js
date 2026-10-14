/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import config from '../../config.js'
import {
    unloadPlugin,
    reloadPlugin
} from '../../handler.js'
import {
    resolvePluginPath,
    isSelfManagementPlugin
} from '../../lib/pluginpath.js'

const TITLE = 'Delete Plugin'

let handler = async (
    m,
    { args, prefix, notifReply }
) => {
    const pfx =
        prefix ||
        config.prefix?.[0] ||
        '.'

    const target = args[0]

    // Tidak ada path
    if (!target) {
        return notifReply(
            `Contoh:\n${pfx}delplugin plugins/downloader/tiktok.js`,
            TITLE
        )
    }

    // Pastikan file benar-benar ada
    const resolved = resolvePluginPath(
        target,
        { mustExist: true }
    )

    if (!resolved.ok) {
        return notifReply(
            resolved.error,
            TITLE
        )
    }

    const { abs, rel } = resolved

    // Jangan izinkan menghapus plugin pengelola plugin
    if (isSelfManagementPlugin(rel)) {
        return notifReply(
            '❌ Plugin addplugin/delplugin dilindungi agar bot tidak terkunci.',
            TITLE
        )
    }

    // Backup untuk rollback kalau proses hapus gagal
    let backup

    try {
        backup = fs.readFileSync(
            abs,
            'utf8'
        )
    } catch (e) {
        return notifReply(
            `❌ Gagal membaca plugin:\n${e.message}`,
            TITLE
        )
    }

    /*
     * Lepas command dari memory terlebih dahulu.
     * Setelah file berhasil dihapus, watcher handler.js
     * juga tidak akan memuatnya kembali.
     */
    const removed = unloadPlugin(abs)

    try {
        fs.unlinkSync(abs)
    } catch (e) {
        console.error(
            '[delplugin] gagal menghapus:',
            e
        )

        // Rollback plugin kalau penghapusan gagal
        try {
            fs.mkdirSync(
                require('path').dirname(abs),
                { recursive: true }
            )

            fs.writeFileSync(
                abs,
                backup,
                'utf8'
            )

            await reloadPlugin(abs)
        } catch (rollbackError) {
            console.error(
                '[delplugin] rollback gagal:',
                rollbackError
            )
        }

        return notifReply(
            `❌ Gagal menghapus plugin:\n${e.message}`,
            TITLE
        )
    }

    const commands =
        removed.length
            ? removed
                .filter(
                    key =>
                        typeof key === 'string'
                )
                .map(
                    key => `${pfx}${key}`
                )
                .join(', ')
            : '-'

    await notifReply(
        `🗑️ *Plugin dihapus*\n\n` +
        `📁 ${rel}\n` +
        `🔌 Command dilepas: ${commands}\n` +
        `♻️ Sudah tidak aktif tanpa restart.`,
        TITLE
    )
}

handler.command = ['delplugin']
handler.desc = 'Hapus plugin dari folder plugins'
handler.owner = true

export default handler