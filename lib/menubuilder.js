/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../config.js'
import { tanggal } from './myfunc.js'
import { getThumb } from './wa.js'
import { plugins } from '../handler.js'

// Membuat menu kategori dengan pola yang sama seperti downloadermenu/groupmenu/gamemenu.
// Fitur diambil otomatis dari plugin yang punya `handler.tags = ['<category>']`.
// Kalau belum ada fitur, menu tetap tampil dengan pesan "belum tersedia" (tanpa command palsu).
export async function sendCategoryMenu(conn, m, { prefix, category, title, emoji, highlight, footerNote = '' }) {
    const date = tanggal(Date.now())
    const pfx = prefix || config.prefix?.[0] || '.'
    const thumb = await getThumb('thumb.jpg')

    const seen = new Set()
    const items = []
    for (const h of plugins.values()) {
        if (!Array.isArray(h.tags) || !h.tags.includes(category)) continue
        if (seen.has(h)) continue
        seen.add(h)

        let label
        if (Array.isArray(h.command)) label = `${h.command[0]}`
        else if (typeof h.command === 'string') label = `${h.command}`
        else continue

        items.push({ label, tag: h.desc || h.description || title })
    }

    const maxLen = Math.max(0, ...items.map(i => i.label.length))
    const list = items.length
        ? items.map(({ label, tag }) => `┆ ${pfx}${label.padEnd(maxLen + 2)}(${tag})`).join('\n')
        : '┆ Fitur untuk kategori ini\n┆ belum tersedia.'

    const anu = `
╭─〔 ${emoji} ${title.toUpperCase()} 〕─⬣
` + '```' + list + '```' + `
╰─⬣

    ᯓ INFO
╭   • Nama Bot : ${config.botName}
┆   • Owner : ${config.ownerName}
┆   • Total Fitur : ${items.length}
╰➤------------------------------
${footerNote ? `\n${footerNote}\n` : ''}`

    const buttons = []
    if (items.length) {
        buttons.push({
            buttonId: `${category}menu`,
            buttonText: { displayText: '☰ menu' },
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'Pilih Menu',
                    sections: [{
                        title: config.botName,
                        highlight_label: highlight,
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
        })
    }
    buttons.push({ buttonId: 'sc', buttonText: { displayText: '☰ script' }, type: 1 })

    await conn.sendMessage(m.chat, {
        buttonsMessage: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: config.botName,
                address: `📍${date}`,
                jpegThumbnail: thumb
            },
            contentText: `*${title}*`,
            footerText: anu,
            buttons,
            headerType: 6
        }
    }, { quoted: m })
}