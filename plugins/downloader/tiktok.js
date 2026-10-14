/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { getTikTokMedia, downloadFirst } from '../../lib/scrape/tiktokdl.js'
import { sendInapp } from '../../lib/inapp.js'

async function react(conn, m, emoji) {
    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: emoji,
                key: m.key
            }
        })
    } catch {}
}

let handler = async (m, { conn, text }) => {
    const url = (text || '').trim()

    if (!url) {
        return sendInapp(conn, m, '- *Contoh* : https://vt.tiktok.com/ZSqvYSt6A/')
    }

    if (!/tiktok\.com/i.test(url)) {
        return sendInapp(conn, m, '> *Link TikTok tidak valid.*')
    }

    await react(conn, m, '🔄')

    try {
        const media = await getTikTokMedia(url)
        const duration = media.duration

        const caption =
            `📝 *Judul:* ${media.title || '-'}${
                duration
                    ? `\n⏱️ *Durasi:* ${duration}`
                    : ''
            }`

        // TikTok slideshow / foto
        if (media.images.length) {
            await react(conn, m, '✅')

            for (const image of media.images.slice(0, 15)) {
                await conn.sendMessage(
                    m.chat,
                    {
                        image: { url: image },
                        caption
                    },
                    { quoted: m }
                )
            }

            return
        }

        // TikTok video: coba tiap link sampai ada yang berhasil diunduh
        if (!media.videos.length) {
            throw new Error('Link video tidak ditemukan.')
        }

        const { buffer } = await downloadFirst(media.videos, {
            maxBytes: (config.limits?.maxDownloadMB ?? 100) * 1024 * 1024
        })

        await react(conn, m, '✅')

        await conn.sendMessage(
            m.chat,
            {
                video: buffer,
                caption,
                mimetype: 'video/mp4'
            },
            { quoted: m }
        )

    } catch (e) {
        console.error('[TikTok]', e)

        await react(conn, m, '❌')

        await sendInapp(conn, m, `> *Gagal download TikTok*\n` +
                    `${e.message}`)
    }
}

handler.command = ['tiktok', 'tt']
handler.desc = 'Download TikTok tanpa watermark'
handler.download = true

export default handler