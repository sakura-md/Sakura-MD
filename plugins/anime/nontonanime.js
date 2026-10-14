/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { getStore } from '../../lib/cache.js'
import { checkCooldown } from '../../lib/cooldown.js'
import { ApiError, downloadBuffer } from '../../lib/api.js'
import { NontonAnimeIDScraper } from '../../lib/scrape/nontonanime.js'

const T = { tags: ['anime'] }
const TITLE = 'NontonAnime'
const BASE = new NontonAnimeIDScraper().baseUrl
const HOST = new URL(BASE).hostname
const SLUG = /^[a-z0-9][a-z0-9-]{1,120}$/i

// Hasil terakhir per user supaya bisa dipanggil dengan nomor: .animedetail 2 / .animestream 5
const last = getStore('anime-last', 30 * 60 * 1000, 1000)
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)
const remember = (m, patch) => last.set(m.sender, { ...(last.get(m.sender) || {}), ...patch })

const guard = (m, notifReply) => {
    if (m.isOwner) return true
    const cd = checkCooldown(`anime:${m.sender}`, config.limits?.cooldown?.anime ?? 5)
    if (cd.ok) return true
    notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur anime lagi.`, TITLE)
    return false
}

// Terima nomor (dari daftar terakhir), link situs ini, atau slug. Link situs lain ditolak.
function resolve(m, raw, key) {
    const s = String(raw || '').trim()
    if (/^\d{1,3}$/.test(s)) {
        const item = (last.get(m.sender)?.[key] || [])[Number(s) - 1]
        return item?.link || null
    }
    if (/^https?:\/\//i.test(s)) {
        try { return new URL(s).hostname === HOST ? new URL(s).href : null } catch { return null }
    }
    return SLUG.test(s) ? s : null
}

const numbered = (items, fmt, max = 10) => items.slice(0, max).map((x, i) => `${i + 1}. ${fmt(x)}`)

async function run(m, notifReply, job) {
    if (!guard(m, notifReply)) return
    try { return await job() } catch (e) {
        console.error(`[${TITLE}]`, e?.message || e)
        await notifReply(box('❌ GAGAL', ['Tidak bisa mengambil data anime.', '', `Detail: ${clip(e instanceof ApiError ? e.message : String(e?.message || e).split('\n')[0], 160)}`]), TITLE)
    }
}

const cards = (x) => `${clip(x.title, 45)}${x.type ? ` [${clip(x.type, 8)}]` : ''}${x.rating ? ` ⭐${clip(x.rating, 5)}` : ''}`

const search = cmd({ command: ['animesearch', 'carianime', 'anime'], desc: 'Cari anime (judul)', ...T, title: TITLE }, async (m, { text, prefix, notifReply }) => {
    const q = text.trim()
    if (!q) return notifReply(`Contoh:\n${pfxOf(prefix)}animesearch one piece`, TITLE)
    await run(m, notifReply, async () => {
        const res = await new NontonAnimeIDScraper().searchAnime(q.slice(0, 80))
        if (!res.length) return notifReply('Anime tidak ditemukan.', TITLE)
        remember(m, { list: res })
        await notifReply(box(`HASIL: ${clip(q, 20).toUpperCase()}`, [...numbered(res, cards), '', `Detail: ${pfxOf(prefix)}animedetail <nomor>`]), TITLE)
    })
})

const ongoing = cmd({ command: ['animeongoing', 'animeairing'], desc: 'Anime yang sedang tayang', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const page = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), 20)
    await run(m, notifReply, async () => {
        const res = await new NontonAnimeIDScraper().getOngoingList(page)
        if (!res.length) return notifReply('Daftar kosong.', TITLE)
        remember(m, { list: res })
        await notifReply(box(`ONGOING (hal ${page})`, [...numbered(res, x => `${clip(x.title, 38)}${x.current_episode ? ` • ${clip(x.current_episode, 12)}` : ''}`, 15), '', `Detail: ${pfxOf(prefix)}animedetail <nomor>`]), TITLE)
    })
})

const popular = cmd({ command: ['animepopular', 'animepopuler'], desc: 'Anime populer', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const page = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), 20)
    await run(m, notifReply, async () => {
        const res = await new NontonAnimeIDScraper().getPopularSeries(page)
        if (!res.length) return notifReply('Daftar kosong.', TITLE)
        remember(m, { list: res })
        await notifReply(box(`POPULER (hal ${page})`, [...numbered(res, cards, 15), '', `Detail: ${pfxOf(prefix)}animedetail <nomor>`]), TITLE)
    })
})

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']
const jadwal = cmd({ command: ['animejadwal', 'jadwalanime'], desc: 'Jadwal rilis anime (per hari)', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const today = DAYS[(new Date(Date.now() + 7 * 3600e3).getUTCDay() + 6) % 7]
    const day = DAYS.includes(String(args[0] || '').toLowerCase()) ? args[0].toLowerCase() : today
    await run(m, notifReply, async () => {
        const data = await new NontonAnimeIDScraper().getJadwalRilis()
        const d = data.kalender_rilis?.[day]
        if (!d?.series?.length) return notifReply(`Jadwal hari ${day} tidak tersedia.`, TITLE)
        remember(m, { list: d.series })
        await notifReply(box(`JADWAL ${day.toUpperCase()}${d.date_text ? ` (${clip(d.date_text, 20)})` : ''}`, [
            ...numbered(d.series, x => `${clip(x.title, 36)}${x.time ? ` ⏰${clip(x.time, 8)}` : ''}${x.episode ? ` • ${clip(x.episode, 10)}` : ''}`, 20),
            '', `Hari lain: ${pfxOf(prefix)}animejadwal <senin..minggu>`
        ]), TITLE)
    })
})

const genre = cmd({ command: ['animegenre', 'genreanime'], desc: 'Daftar genre anime', ...T, title: TITLE }, async (m, { notifReply }) => {
    await run(m, notifReply, async () => {
        const res = await new NontonAnimeIDScraper().getGenresList('az')
        if (!res.length) return notifReply('Daftar genre kosong.', TITLE)
        await notifReply(box('GENRE', [res.slice(0, 50).map(g => g.name).join(', ')]), TITLE)
    })
})

const detail = cmd({ command: ['animedetail', 'detailanime'], desc: 'Detail anime (nomor / link)', ...T, title: TITLE }, async (m, { conn, args, prefix, notifReply }) => {
    const target = resolve(m, args[0], 'list')
    if (!target) return notifReply(`Contoh:\n${pfxOf(prefix)}animedetail 1\n(nomor dari ${pfxOf(prefix)}animesearch / animeongoing / animepopular)\natau pakai link/slug dari ${HOST}`, TITLE)
    await run(m, notifReply, async () => {
        await react(conn, m, '⏳')
        const d = await new NontonAnimeIDScraper().getAnimeDetail(target)
        if (!d.title) { await react(conn, m, '❌'); return notifReply('Anime tidak ditemukan / halaman berubah.', TITLE) }
        remember(m, { eps: d.episodes || [] })
        const eps = d.episodes || []
        const caption = box(clip(d.title, 40).toUpperCase(), [
            d.type && `Tipe     : ${clip(d.type, 20)}`,
            d.score && `Skor     : ${clip(d.score, 6)}`,
            d.status && `Status   : ${clip(d.status, 20)}`,
            d.total_episodes && `Episode  : ${clip(d.total_episodes, 20)}`,
            d.season && `Musim    : ${clip(d.season, 20)}`,
            d.genres?.length && `Genre    : ${clip(d.genres.map(g => g.name).join(', '), 80)}`,
            d.synopsis && `\n${clip(d.synopsis, 450)}`,
            eps.length && `\nEpisode (${eps.length}):`,
            ...eps.slice(0, 8).map((e, i) => `${i + 1}. ${clip(e.title, 40)}`),
            eps.length > 8 && `... lihat semua: ${pfxOf(prefix)}animeeps`,
            eps.length && `Nonton/Download: ${pfxOf(prefix)}animestream <nomor>`
        ])
        let sent = false
        if (d.poster) {
            try {
                const img = await downloadBuffer(d.poster, { maxBytes: 5 * 1024 * 1024 })
                if (img.mime.startsWith('image/')) { await conn.sendMessage(m.chat, { image: img.buffer, caption }, { quoted: m }); sent = true }
            } catch { /* kirim teks saja */ }
        }
        if (!sent) await notifReply(caption, TITLE)
        await react(conn, m, '✅')
    })
})

const eps = cmd({ command: ['animeeps', 'animeepisode'], desc: 'Daftar episode anime terakhir dibuka', ...T, title: TITLE }, async (m, { args, prefix, notifReply }) => {
    const list = last.get(m.sender)?.eps
    if (!list?.length) return notifReply(`Buka detail anime dulu: ${pfxOf(prefix)}animedetail <nomor>`, TITLE)
    const per = 20
    const pages = Math.ceil(list.length / per)
    const page = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), pages)
    const start = (page - 1) * per
    await notifReply(box(`EPISODE (hal ${page}/${pages})`, [
        ...list.slice(start, start + per).map((e, i) => `${start + i + 1}. ${clip(e.title, 40)}${e.date ? ` • ${clip(e.date, 14)}` : ''}`),
        '', `Pilih: ${pfxOf(prefix)}animestream <nomor>`
    ]), TITLE)
})

const stream = cmd({ command: ['animestream', 'nontonanime', 'animedl'], desc: 'Link streaming & download episode', ...T, title: TITLE }, async (m, { conn, args, prefix, notifReply }) => {
    const target = resolve(m, args[0], 'eps')
    if (!target) return notifReply(`Contoh:\n${pfxOf(prefix)}animestream 1\n(nomor dari ${pfxOf(prefix)}animeeps)\natau link episode dari ${HOST}`, TITLE)
    await run(m, notifReply, async () => {
        await react(conn, m, '⏳')
        const sc = new NontonAnimeIDScraper()
        const s = await sc.getStreamingDetail(target)
        if (!s.title) { await react(conn, m, '❌'); return notifReply('Episode tidak ditemukan / halaman berubah.', TITLE) }

        // Ambil link iframe beberapa server (paralel, maksimal 4)
        const servers = (s.video_servers || []).slice(0, 4)
        const frames = await Promise.all(servers.map(v => sc.getVideoIframe(v.post_id, v.nume, v.server_type || v.server_name, s.nonce, s.ajax_url).catch(() => '')))

        const lines = [`${clip(s.title, 60)}`, '']
        if (s.default_video_url) lines.push('▶️ Streaming:', s.default_video_url)
        servers.forEach((v, i) => frames[i] && frames[i] !== s.default_video_url && lines.push(`• ${clip(v.server_name, 14)}: ${frames[i]}`))
        if (s.download_links?.length) {
            lines.push('', '📥 Download:')
            for (const g of s.download_links.slice(0, 5)) {
                lines.push(`[${clip(g.format, 12)}] ${g.links.slice(0, 4).map(l => `${clip(l.label, 12)}: ${l.url}`).join(' | ')}`)
            }
        }
        if (s.next_episode_link) lines.push('', `Berikutnya: ${pfxOf(prefix)}animestream ${s.next_episode_link}`)
        await notifReply(box('NONTON ANIME', lines), TITLE)
        await react(conn, m, '✅')
    })
})

export default search
export const handlers = [ongoing, popular, jadwal, genre, detail, eps, stream]
