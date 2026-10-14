/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { ApiError, sakuraRequest, describeResult } from '../../lib/api.js'
import { checkCooldown, acquireLock, releaseLock, resetCooldown } from '../../lib/cooldown.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur ini — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
const API_KEY = ''   // ← isi API key SakuraApis kamu di antara tanda kutip
const BASE_URL = 'https://api.haidarxd.my.id'
const sakura = (endpoint, params = {}, opts = {}) => sakuraRequest(endpoint, params, { apikey: API_KEY, baseUrl: BASE_URL, ...opts })


const TITLE = 'Spam NGL'

let handler = async (m, { args, prefix, notifReply }) => {
    const pfx = prefix || config.prefix?.[0] || '.'
    const maxCount = config.limits?.spamngl?.maxCount ?? 5
    const maxLen = config.limits?.spamngl?.maxMessageLength ?? 200
    const usage = `Format:\n${pfx}spamngl <username> <pesan> <jumlah>\n\nContoh:\n${pfx}spamngl yabes Halo salam kenal ya! 1\n\nMaksimal ${maxCount} pesan per command.`

    if (args.length < 3) return notifReply(usage, TITLE)

    const username = args[0].replace(/^@/, '')
    const countRaw = args[args.length - 1]
    const message = args.slice(1, -1).join(' ').trim()

    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) return notifReply('Username NGL tidak valid (huruf, angka, titik, underscore; maks 30).', TITLE)
    if (!/^\d+$/.test(countRaw)) return notifReply(`Jumlah harus angka.\n\n${usage}`, TITLE)
    const count = Number(countRaw)
    if (count < 1 || count > maxCount) return notifReply(`Jumlah harus 1 sampai ${maxCount}.`, TITLE)
    if (!message) return notifReply(`Pesan tidak boleh kosong.\n\n${usage}`, TITLE)
    if (message.length > maxLen) return notifReply(`Pesan terlalu panjang (maks ${maxLen} karakter).`, TITLE)

    const cdKey = `spamngl:${m.sender}`
    if (!m.isOwner) {
        const cd = checkCooldown(cdKey, config.limits?.cooldown?.spamngl ?? 120)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    }
    if (!acquireLock(cdKey)) return notifReply('Proses sebelumnya masih berjalan.', TITLE)

    try {
        await notifReply(`📨 Mengirim ${count} pesan ke @${username}...`, TITLE)
        // Tidak ada retry: request ini mengirim pesan ke pihak ketiga dan tidak aman diulang.
        const data = await sakura('/api/v1/tools/spamngl', { username, message, count }, { retries: 0 })
        await notifReply(`✅ Selesai.\n\n${describeResult(data, 800)}`, TITLE)
    } catch (e) {
        console.error('[spamngl error]', e)
        if (e instanceof ApiError && ['NO_API_KEY', 'INVALID_URL'].includes(e.code)) resetCooldown(cdKey)
        await notifReply(e instanceof ApiError ? e.message : `Gagal: ${e.message}`, TITLE)
    } finally {
        releaseLock(cdKey)
    }
}

handler.command = ['spamngl']
handler.desc = 'Kirim pesan anonim ke NGL (dibatasi)'
handler.tags = ['tools']
handler.premium = true

export default handler