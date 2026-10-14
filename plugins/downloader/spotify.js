/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import os from 'os'
import path from 'path'
import axios from 'axios'
import { sendInapp } from '../../lib/inapp.js'

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

let handler = async (m, { conn, text, prefix, command, notifReply }) => {
    const url = text?.trim()
    const reply = (t) => sendInapp(conn, m, t)

    if (!url) {
        return reply(
            `🎵 *Spotify Rich Player*\n\n` +
            `Masukkan link Spotify.\n\n` +
            `Contoh:\n` +
            `${prefix}${command} https://open.spotify.com/track/xxxxxxxx`
        )
    }

    if (!url.includes('open.spotify.com')) {
        return reply('❌ Link yang dikirim bukan link Spotify.')
    }

    let filePath = null

    try {
        await notifReply('Sedang mengambil informasi Spotify...', 'Spotify')

        const embedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
        const response = await axios.get(embedUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'application/json'
            }
        })

        const info = response.data
        const title = info.title || 'Spotify Track'
        const thumbnail = info.thumbnail_url || ''
        const spotifyUrl = info.url || url

        const match = spotifyUrl.match(
            /open\.spotify\.com\/(?:intl-[^/]+\/)?(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/
        )
        const type = match?.[1] || 'track'

        let songTitle = title
        let songArtist = `Spotify ${type}`
        if (title.includes(' - ')) {
            const parts = title.split(' - ')
            songTitle = parts[0]
            songArtist = parts.slice(1).join(' - ')
        }

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(songTitle)} - Spotify UI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #0d0d0d; color: #ffffff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .container { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 20px; }
        .spotify-card, .ws-card { background-color: #161616; border-radius: 20px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .album-art { width: 100%; height: 220px; border-radius: 12px; overflow: hidden; margin-bottom: 15px; background-color: #282828; }
        .album-art img { width: 100%; height: 100%; object-fit: cover; }
        .song-info { margin-bottom: 15px; }
        .song-title { font-size: 1.2rem; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .song-artist { font-size: 0.9rem; color: #b3b3b3; margin-top: 3px; }
        .progress-container { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; font-size: 0.75rem; color: #b3b3b3; }
        .progress-bar-bg { flex-grow: 1; height: 4px; background-color: #404040; border-radius: 2px; position: relative; }
        .progress-bar-fill { width: 0%; height: 100%; background-color: #ffffff; border-radius: 2px; }
        .player-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 10px; }
        .player-controls i { color: #ffffff; cursor: pointer; font-size: 1.1rem; }
        .player-controls .fa-play, .player-controls .fa-pause { font-size: 1.4rem; }
        .volume-container { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #b3b3b3; }
        .volume-bar-bg { flex-grow: 1; height: 4px; background-color: #404040; border-radius: 2px; }
        .volume-bar-fill { width: 70%; height: 100%; background-color: #ffffff; border-radius: 2px; }
        .ws-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .ws-title { font-size: 0.85rem; font-weight: bold; letter-spacing: 1px; color: #b3b3b3; }
        .status-badge { font-size: 0.75rem; font-weight: bold; padding: 3px 10px; border-radius: 4px; }
        .status-badge.downloading { background-color: #ffa500; color: #000; }
        .status-badge.complete { background-color: #2ecc71; color: #000; }
        .ws-url { font-size: 0.85rem; color: #ffffff; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; }
        .stat-box { background-color: #212121; padding: 10px; border-radius: 8px; text-align: center; }
        .stat-label { font-size: 0.65rem; color: #888; margin-bottom: 4px; text-transform: uppercase; }
        .stat-value { font-size: 0.85rem; font-weight: bold; color: #fff; }
        .terminal-box { background-color: #111111; border-radius: 8px; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 0.75rem; height: 110px; overflow-y: auto; color: #a8a8a8; border: 1px solid #222; }
        .terminal-box p { margin-bottom: 4px; }
        .open-spotify-btn { display: block; width: 100%; margin-top: 15px; padding: 10px; text-align: center; background-color: #1ed760; color: #000; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spotify-card">
            <div class="album-art">
                ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="Album Art" id="albumImage">` : ''}
            </div>
            <div class="song-info">
                <div class="song-title">${escapeHtml(songTitle)}</div>
                <div class="song-artist">${escapeHtml(songArtist)}</div>
            </div>
            <div class="progress-container">
                <span id="currentTime">0:00</span>
                <div class="progress-bar-bg" id="progressBar"><div class="progress-bar-fill" id="progressFill"></div></div>
                <span id="totalTime">3:45</span>
            </div>
            <div class="player-controls">
                <i class="fa-solid fa-shuffle"></i>
                <i class="fa-solid fa-backward-step"></i>
                <i class="fa-solid fa-play" id="playBtn" onclick="togglePlay()"></i>
                <i class="fa-solid fa-forward-step"></i>
                <i class="fa-solid fa-rotate-right"></i>
            </div>
            <div class="volume-container">
                <i class="fa-solid fa-volume-high"></i>
                <div class="volume-bar-bg"><div class="volume-bar-fill"></div></div>
            </div>
            <a href="${escapeHtml(spotifyUrl)}" target="_blank" class="open-spotify-btn">
                <i class="fa-brands fa-spotify"></i> Open in Spotify
            </a>
        </div>

        <div class="ws-card">
            <div class="ws-header">
                <span class="ws-title">PLAYER STATUS</span>
                <span id="statusBadge" class="status-badge downloading">LOADING</span>
            </div>
            <div class="ws-url">Preview via open.spotify.com/oembed</div>
            <div class="stats-grid">
                <div class="stat-box"><div class="stat-label">Format</div><div class="stat-value">preview</div></div>
                <div class="stat-box"><div class="stat-label">Type</div><div class="stat-value">${escapeHtml(type)}</div></div>
                <div class="stat-box"><div class="stat-label">Status</div><div class="stat-value" id="progressPercent">0%</div></div>
            </div>
            <div class="terminal-box" id="terminalLogs">
                <p>Fetching metadata...</p>
                <p>MIME: application/json</p>
            </div>
        </div>
    </div>

    <script>
        let isPlaying = false;
        function togglePlay() {
            isPlaying = !isPlaying;
            const playBtn = document.getElementById('playBtn');
            playBtn.classList.toggle('fa-play', !isPlaying);
            playBtn.classList.toggle('fa-pause', isPlaying);
        }
        let pct = 0;
        const terminal = document.getElementById('terminalLogs');
        const progressPercent = document.getElementById('progressPercent');
        const statusBadge = document.getElementById('statusBadge');
        const interval = setInterval(() => {
            if (pct < 100) {
                pct += Math.floor(Math.random() * 8) + 4;
                if (pct > 100) pct = 100;
                progressPercent.innerText = pct + '%';
                if (pct >= 100) {
                    statusBadge.innerText = 'READY';
                    statusBadge.classList.remove('downloading');
                    statusBadge.classList.add('complete');
                    const p = document.createElement('p');
                    p.innerText = 'Player ready';
                    terminal.appendChild(p);
                    terminal.scrollTop = terminal.scrollHeight;
                    clearInterval(interval);
                }
            }
        }, 250);
    </script>
</body>
</html>`

        const fileName = `spotify_${Date.now()}.html`
        filePath = path.join(os.tmpdir(), fileName)
        fs.writeFileSync(filePath, html, 'utf8')

        const caption = `🎵 *SPOTIFY RICH PLAYER*\n\n` +
            `🎧 *${songTitle}*\n` +
            `👤 *${songArtist}*\n\n` +
            `🔗 ${spotifyUrl}\n\n` +
            `🌐 HTML player dibuat dari metadata publik Spotify (oEmbed) — bukan file audio, cuma tampilan info lagu.`

        if (thumbnail) {
            await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption }, { quoted: m })
        } else {
            await reply(caption)
        }

        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(filePath),
            mimetype: 'text/html',
            fileName
        }, { quoted: m })
    } catch (error) {
        console.error('[spotify error]', error)
        await notifReply(error.response?.data?.error?.message || error.message, 'Spotify Error')
    } finally {
        if (filePath) {
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
                } catch (e) {
                    console.error('Gagal menghapus HTML:', e)
                }
            }, 30000)
        }
    }
}

handler.command = ['spotify', 'sp', 'playspotify']
handler.desc = 'Spotify info card + HTML rich player (oEmbed, bukan download audio)'
handler.download = true

export default handler