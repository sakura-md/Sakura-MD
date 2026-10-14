/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import { cmd, react } from '../../lib/plugkit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')

let handler = async (m, { conn, notifReply }) => {
    if (!fs.existsSync(path.join(root, '.git'))) {
        return notifReply(
            'Mekanisme update tidak tersedia: project ini bukan repository git.\nUpdate manual: ganti file lalu gunakan .reloadall',
            'Update'
        )
    }

    await react(conn, m, '⏳')

    const out = await new Promise((resolve, reject) => {
        execFile(
            'git',
            ['pull', '--ff-only'],
            {
                cwd: root,
                timeout: 60000
            },
            (err, stdout, stderr) => {
                if (err) {
                    return reject(
                        new Error(
                            (stderr || err.message).split('\n')[0]
                        )
                    )
                }

                resolve(stdout.trim())
            }
        )
    })

    await notifReply(
        `✅ ${out.slice(0, 500) || 'Selesai.'}\n\nBila ada perubahan file inti, bot restart otomatis (atau jalankan .restart)`,
        'Update'
    )
}

handler.command = ['update']
handler.desc = 'git pull (jika project berupa repo git)'
handler.tags = ['owner']
handler.creator = true
handler.title = 'Update'
handler.requirePrefix = true

export default handler
