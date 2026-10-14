/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toggleMsg, toggleExample, pfxOf } from '../../lib/format.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const settingPath = path.join(__dirname, '../../database/autoread.json')

function getSetting() {
    try {
        return JSON.parse(fs.readFileSync(settingPath, 'utf8'))
    } catch {
        return { enabled: false }
    }
}

function saveSetting(data) {
    fs.writeFileSync(settingPath, JSON.stringify(data, null, 2))
}

let handler = async (m, { args, prefix, notifReply }) => {
    const mode = String(args[0] || '').toLowerCase()
    const setting = getSetting()

    if (!['on', 'off'].includes(mode)) {
        return notifReply(toggleExample(pfxOf(prefix), 'autoread'), 'Auto Read')
    }

    setting.enabled = mode === 'on'
    saveSetting(setting)

    await notifReply(
        toggleMsg(setting.enabled, 'Auto Read'),
        'Auto Read'
    )
}

handler.command = ['autoread']
handler.desc = 'Aktifkan/nonaktifkan auto read'
handler.owner = true

export default handler
