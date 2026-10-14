/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { ApiError, sakuraRequest, pickResultUrl, describeResult } from '../../lib/api.js'
import { checkCooldown } from '../../lib/cooldown.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur ini — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
const API_KEY = ''   // ← isi API key SakuraApis kamu di antara tanda kutip
const BASE_URL = 'https://api.haidarxd.my.id'
const sakura = (endpoint, params = {}, opts = {}) => sakuraRequest(endpoint, params, { apikey: API_KEY, baseUrl: BASE_URL, ...opts })


const TITLE = 'Bypass Link'

let handler = async (m, { text, prefix, notifReply }) => {
    const pfx = prefix || config.prefix?.[0] || '.'
    const input = (text || '').trim().split(/\s+/)[0]
    if (!input) return notifReply(`Contoh:\n${pfx}bypasslink https://linkvertise.com/xxxx`, TITLE)
    if (!/^https?:\/\/\S+\.\S+/i.test(input)) return notifReply('Link tidak valid. Harus diawali http:// atau https://', TITLE)

    if (!m.isOwner) {
        const cd = checkCooldown(`bypass:${m.sender}`, config.limits?.cooldown?.bypass ?? 5)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    }

    try {
        await notifReply('🔄 Memproses link...', TITLE)
        const data = await sakura('/api/v1/tools/bypaslink', { url: input }, { retries: 1 })
        const result = pickResultUrl(data, { exclude: [input] }) || describeResult(data)
        if (!result) throw new ApiError('API tidak mengembalikan hasil.', { code: 'NO_RESULT' })
        await notifReply(`🔗 *Link asli:*\n${input}\n\n✅ *Hasil:*\n${result}`, TITLE)
    } catch (e) {
        console.error('[bypasslink error]', e)
        await notifReply(e instanceof ApiError ? e.message : `Gagal: ${e.message}`, TITLE)
    }
}

handler.command = ['bypasslink', 'bypass']
handler.desc = 'Bypass link shortener'
handler.tags = ['tools']

export default handler