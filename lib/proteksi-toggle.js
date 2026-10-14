/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { cmd } from './plugkit.js'
import { getGroup, saveGroups } from './guard.js'
import { parseOnOff, pfxOf, toggleMsg, toggleExample } from './format.js'

const TAGS = ['proteksi']

const onOff = (v) => (
    v && v !== 'off'
        ? `ON${typeof v === 'string' ? ` (${v})` : ''}`
        : 'OFF'
)

export const makeToggle = (
    name,
    desc,
    { modes = null } = {}
) => cmd({
    command: [name],
    desc,
    tags: TAGS,
    group: true,
    admin: true,
    title: name
}, async (m, { args, prefix, notifReply }) => {
    const g = getGroup(m.chat)
    const arg = String(args[0] || '').toLowerCase()
    const pfx = pfxOf(prefix)

    const label = name.charAt(0).toUpperCase() + name.slice(1)
    const options = modes ? [...modes, 'off'] : ['on', 'off']

    if (!arg) {
        return notifReply(toggleExample(pfx, name, options), label)
    }

    let value

    if (modes && modes.includes(arg)) {
        value = arg
    } else {
        const parsed = parseOnOff(arg)

        if (parsed === null) {
            return notifReply(toggleExample(pfx, name, options), label)
        }

        value = modes
            ? (parsed ? modes[0] : 'off')
            : parsed
    }

    g[name] = value
    saveGroups()

    return notifReply(
        `${toggleMsg(value && value !== 'off', label)}${typeof value === 'string' && value !== 'off' ? ` (${value})` : ''}`,
        label
    )
})