/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import config from '../../config.js'
import { tanggal } from '../../lib/myfunc.js'
import { plugins } from '../../handler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const groupThumbPath = path.join(__dirname, '../../media/thumb.jpg')

let handler = async (m, { conn, prefix, notifReply }) => {
  try {
    const date = tanggal(Date.now())
    const pfx = prefix || config.prefix?.[0] || '.'

    let thumb
    try {
        thumb = await sharp(groupThumbPath)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer()
    } catch (e) {
        thumb = Buffer.alloc(0)
    }

    // Filter command yang hanya bisa dipakai di grup (handler.group = true)
    const seen = new Set()
    const items = []
    for (const h of plugins.values()) {
        if (!h.group) continue
        if (h.owner || h.creator) continue
        if (seen.has(h)) continue
        seen.add(h)

        let label
        if (Array.isArray(h.command)) label = `${h.command[0]}`
        else if (typeof h.command === 'string') label = `${h.command}`
        else continue

        items.push({ label, tag: h.desc || h.tags?.[0] || 'Group' })
    }

    const maxLen = Math.max(0, ...items.map(i => i.label.length))
    const list = items
        .map(({ label, tag }) => `┆ .${label.padEnd(maxLen + 2)}(${tag})`)
        .join('\n')

    const msg = `*Group Menu*`

    const anu = `
╭─〔 👥 GROUP MENU 〕─⬣
` + '```' + (list || '┆ (Belum ada fitur grup)') + '```' + `
╰─⬣

    ᯓ INFO
╭   • Nama Bot : ${config.botName}
┆   • Owner : ${config.ownerName}
┆   • Total Fitur : ${items.length}
╰➤------------------------------

_ᴋʜᴜsᴜs ᴜɴᴛᴜᴋ ᴅɪ ᴅᴀʟᴀᴍ ɢʀᴜᴘ ᴀᴊᴀ ʏᴀ ᴋᴀᴋ 👥_
`

    await conn.sendMessage(m.chat, {
        buttonsMessage: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: config.botName,
                address: `📍${date}`,
                jpegThumbnail: thumb
            },
            contentText: msg,
            footerText: anu,
            buttons: [
                {
                    buttonId: 'groupmenu',
                    buttonText: { displayText: '☰ menu' },
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Pilih Menu',
                            sections: [{
                                title: config.botName,
                                highlight_label: 'Group Only 👥',
                                rows: items.map(({ label, tag }) => ({
                                    header: '',
                                    title: pfx + label,
                                    description: tag,
                                    id: pfx + label
                                }))
                            }]
                        })
                    },
                    type: 1
                },
                {
                    buttonId: 'sc',
                    buttonText: { displayText: '☰ script' },
                    type: 1
                }
            ],
            headerType: 6
        }
    }, { quoted: m })
  } catch (e) {
    console.error('[GroupMenu] Error:', e)
    await notifReply(`Gagal menampilkan Group Menu:\n${e.message}`, 'Group Menu')
  }
}

handler.command = ['groupmenu', 'grupmenu', 'menugrup']
handler.group = true
handler.desc = 'Group Only'

export default handler