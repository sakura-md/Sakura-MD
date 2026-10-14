/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config.js'
import { runtime, tanggal } from '../../lib/myfunc.js'
import { getThumb } from '../../lib/wa.js'
import { getStore } from '../../lib/cache.js'
import { pfxOf } from '../../lib/format.js'
import { uniqueHandlers, categoryOf, categoryLabel } from '../../lib/helpinfo.js'
import logger from '../../lib/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginDir = path.join(__dirname, '..')

function countPluginFiles(dir) {
    if (!fs.existsSync(dir)) return 0
    let total = 0
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) total += countPluginFiles(full)
        else if (item.isFile() && item.name.endsWith('.js')) total++
    }
    return total
}
const audioPath = path.join(__dirname, '../../media/Sakura.mp3')
const audioSent = getStore('allmenu-audio-sent', 60 * 1000, 200)

// Kategori yang tampil paling atas (urutan sama dengan menu utama)
const POPULAR = ['owner', 'group', 'game', 'downloader', 'ping']

// Command yang tidak perlu ikut ditampilkan di daftar
const HIDDEN = new Set(['menu', 'help', 'allmenu', 'listmenu'])

// Simbol akses di samping command
const symbolsOf = (h) => {
    const s = []
    if (h.creator) s.push('🅒')
    if (h.owner) s.push('🅞')
    if (h.premium) s.push('🅟')
    if (h.group) s.push('🅖')
    return s.length ? ' ' + s.join(' ') : ''
}

const box = (title, lines) =>
    `╭➤--「 ${title} MENU 」\n${lines.map(l => `┆ ⇝ ${l}`).join('\n')}\n╰━━━━━━━━━━━━━━━━━━━╯\n\n`

// Kelompokkan semua command berdasarkan kategori (tags[0])
function collect(isOwner) {
    const groups = {}
    for (const h of uniqueHandlers()) {
        const first = String(Array.isArray(h.command) ? h.command[0] : h.command)
        if (HIDDEN.has(first)) continue
        // menu kategori (xxxmenu) tidak perlu ditampilkan lagi
        if (/menu$/.test(first) && !h.tags?.includes('system')) continue
        const cat = categoryOf(h)
        if (cat === 'owner' && !isOwner) continue
        ;(groups[cat] ||= []).push({ first, h })
    }
    return groups
}

const orderCategories = (groups) => {
    const keys = Object.keys(groups)
    const popular = POPULAR.filter(k => keys.includes(k))
    const rest = keys.filter(k => !POPULAR.includes(k)).sort((a, b) => a.localeCompare(b))
    return { popular, rest }
}

function buildList(groups, pfx) {
    const { popular, rest } = orderCategories(groups)
    return [...popular, ...rest].map(cat => {
        const items = groups[cat].sort((a, b) => a.first.localeCompare(b.first))
        const label = categoryLabel(cat)
        const emoji = label.split(' ')[0]
        const name = label.replace(/^\S+\s/, '').toUpperCase()
        return box(`${emoji} ${name}`, items.map(({ first, h }) => `${pfx}${first}${symbolsOf(h)}`))
    }).join('').trimEnd()
}

// Pecah teks panjang jadi beberapa pesan (cadangan kalau tombol gagal terkirim)
const chunkText = (text, max = 3500) => {
    const parts = []
    let cur = ''
    for (const block of text.split('\n\n')) {
        if ((cur + '\n\n' + block).length > max && cur) { parts.push(cur); cur = block } else cur = cur ? cur + '\n\n' + block : block
    }
    if (cur) parts.push(cur)
    return parts
}

async function sendAudio(conn, m) {
    try {
        if (m.id && audioSent.get(m.id)) return
        if (!fs.existsSync(audioPath)) return
        if (m.id) audioSent.set(m.id, true)
        await conn.sendMessage(m.chat, { audio: await fs.promises.readFile(audioPath), mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
    } catch (e) {
        console.error('[allmenu] gagal kirim audio:', e?.message || e)
    }
}

let handler = async (m, { conn, prefix }) => {
    const pfx = pfxOf(prefix)
    const pushname = m.pushName || 'No Name'
    const role = m.isCreator ? 'Creator' : m.isOwner ? 'Owner' : m.isPremium ? 'Premium' : 'User'

    const groups = collect(m.isOwner)
    const totalFitur = countPluginFiles(pluginDir)
    const totalKategori = Object.keys(groups).length
    const list = buildList(groups, pfx)

    const header =
`🌸━━━〔 *𝐀𝐥𝐥 𝐌𝐞𝐧𝐮* 〕━━━🌸

✦ *Informasi User*
• Nama   : ${pushname}
• Status : ${role}

✦ *Informasi Bot*
• Nama     : ${config.botName}
• Versi    : ${config.version}
• Mode     : ${config.botMode === 'public' ? 'Public' : 'Self'}
• Uptime   : ${runtime(process.uptime())}
• Kategori : ${totalKategori}
• Fitur    : ${totalFitur} fitur

`
    const body = header + list
    const footer = `🅒 Creator  🅞 Owner  🅟 Premium  🅖 Grup  •  ${pfx}help <command>`

    try {
        await conn.sendMessage(m.chat, {
            buttonsMessage: {
                locationMessage: {
                    degreesLatitude: 0,
                    degreesLongitude: 0,
                    name: config.botName,
                    address: `📍${tanggal(Date.now())}`,
                    jpegThumbnail: await getThumb('thumb.jpg')
                },
                contentText: body,
                footerText: footer,
                buttons: [
                    { buttonId: 'menu', buttonText: { displayText: '🌸 Kembali Ke Menu Utama' }, type: 1 },
                    { buttonId: 'sc', buttonText: { displayText: '☰ script' }, type: 1 }
                ],
                headerType: 6
            }
        }, { quoted: m })
    } catch (e) {
        // Cadangan: kalau pesan tombol gagal, kirim sebagai teks biasa (dipecah)
        logger.warn(`[allmenu] pesan tombol gagal (${e?.message || e}), kirim teks biasa`)
        const parts = chunkText(body + '\n\n' + footer)
        for (const part of parts) await conn.sendMessage(m.chat, { text: part }, { quoted: m })
    }

    await sendAudio(conn, m)
}

handler.command = ['allmenu', 'fullmenu', 'semua']
handler.desc = 'Semua kategori & command sekaligus'
handler.tags = ['system']

export default handler