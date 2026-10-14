import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import config from '../../config.js'
import { runtime, tanggal } from '../../lib/myfunc.js'
import { getStore } from '../../lib/cache.js'
import { helpDetail } from '../../lib/helpinfo.js'
import { react } from '../../lib/plugkit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const thumbPath = path.join(__dirname, '../../media/thumb.jpg')
const audioPath = path.join(__dirname, '../../media/Sakura.mp3')
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

const audioSent = getStore('menu-audio-sent', 60 * 1000, 200)
let audioMissingWarned = false

async function sendMenuAudio(conn, m) {
    try {
        if (m.id && audioSent.get(m.id)) return

        if (!fs.existsSync(audioPath)) {
            if (!audioMissingWarned) {
                audioMissingWarned = true
                console.warn(
                    '[menu] media/Sakura.mp3 tidak ditemukan, audio menu dilewati.'
                )
            }
            return
        }

        if (m.id) audioSent.set(m.id, true)

        const audio = await fs.promises.readFile(audioPath)

        await conn.sendMessage(
            m.chat,
            {
                audio,
                mimetype: 'audio/mpeg',
                ptt: false
            },
            { quoted: m }
        )
    } catch (e) {
        console.error('Gagal mengirim Sakura.mp3:', e)
    }
}

let handler = async (
    m,
    {
        conn,
        prefix,
        command,
        args,
        notifReply
    }
) => {

    // ========================================================
    // AUTO REACT .MENU
    // React dikirim SEBELUM menu dibalas
    // Emoji diambil dari config.js
    // ========================================================
    if (
        command === 'menu' &&
        config.menu?.reaction?.enabled !== false
    ) {
        await react(
            conn,
            m,
            config.menu?.reaction?.emoji || '🌸'
        )
    }

    // ========================================================
    // HELP
    // ========================================================
    if (command === 'help' && args?.[0]) {
        return notifReply(
            helpDetail(args[0], prefix),
            'Help'
        )
    }

    const pushname = m.pushName || 'No Name'
    const date = tanggal(Date.now())

    // ========================================================
    // THUMBNAIL
    // ========================================================
    let thumb

    try {
        thumb = await sharp(thumbPath)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer()
    } catch (e) {
        thumb = Buffer.alloc(0)
    }

    // ========================================================
    // TOTAL FITUR
    // ========================================================
    const totalFitur = countPluginFiles(pluginDir)

    const msg = `*haloo ${pushname}*`

    const anu = `
🌸━━━〔 *𝐌𝐞𝐧𝐮* 〕━━━🌸

➤ Nᴀᴍᴀ Bᴏᴛ : *${config.botName}*
➤ Uѕᴇʀ : *${pushname}*
➤ Mᴏᴅᴇ : ${config.botMode === 'public' ? '*Public*' : '*Self*'}
➤ Vᴇʀѕɪ : *${config.version}*
➤ Tᴏᴛᴀʟ Fɪᴛᴜʀ : *${totalFitur} ғɪᴛᴜʀ*

🌸━━━〔 *No Spam* 〕━━━🌸

_ᴛᴏʟᴏɴɢ ᴊᴀɴɢᴀɴ sᴘᴀᴍ ʏᴀ 🐣_
_ɢᴜɴᴀᴋᴀɴ ᴅᴇɴɢᴀɴ ʙɪᴊᴀᴋ_

📚 *Pilih kategori dari tombol di bawah untuk membuka command.*
`

    // ========================================================
    // KIRIM MENU
    // ========================================================
    await conn.sendMessage(
        m.chat,
        {
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
                        buttonId: 'menu',
                        buttonText: {
                            displayText: '☰ menu'
                        },
                        nativeFlowInfo: {
                            name: 'single_select',

                            paramsJson: JSON.stringify({
                                title: 'Pilih Menu',

                                sections: [
                                    {
                                        title: config.botName,
                                        highlight_label:
                                            'Paling Populer 🔥',

                                        rows: [
                                            {
                                                header: '',
                                                title:
                                                    '📖 𝗔𝗟𝗟 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan semua kategori sekaligus',
                                                id:
                                                    `${prefix}allmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '👑 𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂',
                                                description:
                                                    'Tampilkan Owner Menu',
                                                id:
                                                    `${prefix}ownermenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '👥 𝗚𝗿𝗼𝘂𝗽 𝗠𝗲𝗻𝘂',
                                                description:
                                                    'Tampilkan Group Menu',
                                                id:
                                                    `${prefix}groupmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🌸 𝗚𝗮𝗺𝗲 𝗠𝗲𝗻𝘂',
                                                description:
                                                    'Tampilkan Game Menu',
                                                id:
                                                    `${prefix}gamemenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '📥 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿 𝗠𝗲𝗻𝘂',
                                                description:
                                                    'Tampilkan Downloader Menu',
                                                id:
                                                    `${prefix}downloadermenu`
                                            },
                                            {
                                                header: '',
                                                title:
                                                    '💻 𝗜𝗻𝘀𝘁𝗮𝗹𝗹𝗲𝗿 𝗠𝗲𝗻𝘂',
                                                description:
                                                    'Tampilkan Downloader Menu',
                                                id:
                                                    `${prefix}installermenu`
                                            },
                                            
                                            {
                                                header: '',
                                                title:
                                                    '〽️ 𝗣𝗶𝗻𝗴 𝗦𝗲𝗿𝘃𝗲𝗿',
                                                description:
                                                    'Server Live',
                                                id:
                                                    `${prefix}ping`
                                            }
                                        ]
                                    },

                                    {
                                        title:
                                            `${config.botName} • Kategori Lainnya`,

                                        rows: [
                                            {
                                                header: '',
                                                title:
                                                    '🛡️ 𝗣𝗥𝗢𝗧𝗘𝗞𝗦𝗜 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Proteksi Menu',
                                                id:
                                                    `${prefix}proteksimenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🔍 𝗦𝗧𝗔𝗟𝗞𝗘𝗥 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Stalker Menu',
                                                id:
                                                    `${prefix}stalkermenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🎯 𝗖𝗘𝗞 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Cek Menu',
                                                id:
                                                    `${prefix}cekmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🔮 𝗣𝗥𝗜𝗠𝗕𝗢𝗡 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Primbon Menu',
                                                id:
                                                    `${prefix}primbonmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '✨ 𝗘𝗣𝗛𝗢𝗧𝗢 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Ephoto Menu',
                                                id:
                                                    `${prefix}ephotomenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🔧 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Tools Menu',
                                                id:
                                                    `${prefix}toolsmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '💰 𝗦𝗘𝗪𝗔 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Sewa Menu',
                                                id:
                                                    `${prefix}sewamenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🤖 𝗔𝗜 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan AI Menu',
                                                id:
                                                    `${prefix}aimenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🪄 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Sticker Menu',
                                                id:
                                                    `${prefix}stickermenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '⚔️ 𝗥𝗣𝗚 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan RPG Menu',
                                                id:
                                                    `${prefix}rpgmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '📳 𝗔𝗣𝗞 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan APK Menu',
                                                id:
                                                    `${prefix}apkmenu`
                                            },

                                            {
                                                header: '',
                                                title:
                                                    '🍥 𝗔𝗡𝗜𝗠𝗘 𝗠𝗘𝗡𝗨',
                                                description:
                                                    'Tampilkan Anime Menu',
                                                id:
                                                    `${prefix}animemenu`
                                            }
                                        ]
                                    }
                                ]
                            })
                        },
                        type: 1
                    },

                    {
                        buttonId: 'sc',
                        buttonText: {
                            displayText: '☰ script'
                        },
                        type: 1
                    }
                ],

                headerType: 6
            }
        },
        { quoted: m }
    )

    // ========================================================
    // AUDIO MENU
    // ========================================================
    await sendMenuAudio(conn, m)
}

handler.command = ['menu', 'help']
handler.desc = 'Menu Utama'

export default handler