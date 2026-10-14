/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { ApiError, sakuraRequest, describeResult, firstString } from '../../lib/api.js'
import { checkCooldown } from '../../lib/cooldown.js'

// ╔══════════════════════════════════════════════════════════╗
// ║  API KEY fitur ini — isi di sini (tidak ada key di config) ║
// ╚══════════════════════════════════════════════════════════╝
const API_KEY = ''   // ← isi API key SakuraApis kamu di antara tanda kutip
const BASE_URL = 'https://api.haidarxd.my.id'
const sakura = (endpoint, params = {}, opts = {}) => sakuraRequest(endpoint, params, { apikey: API_KEY, baseUrl: BASE_URL, ...opts })


const TITLE = 'Bypass Web'
const MAX_ITEMS = 80

function extractSites(data) {
    const root = data?.result ?? data?.data ?? data?.sites ?? data
    const list = Array.isArray(root) ? root : (Array.isArray(root?.sites) ? root.sites : null)
    if (!list) return null
    return list
        .map(item => typeof item === 'string' ? item : firstString(item?.name, item?.domain, item?.host, item?.url, item?.site))
        .filter(Boolean)
}

let handler = async (m, { notifReply }) => {
    if (!m.isOwner) {
        const cd = checkCooldown(`bypassweb:${m.sender}`, config.limits?.cooldown?.bypass ?? 5)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
    }
    try {
        const data = await sakura('/api/v1/tools/bypaslink-sites', {}, { retries: 1 })
        const sites = extractSites(data)
        if (!sites) return await notifReply(describeResult(data, 3000) || 'Respon kosong.', TITLE)
        if (!sites.length) return await notifReply('Belum ada daftar web yang didukung.', TITLE)

        const shown = sites.slice(0, MAX_ITEMS).map((s, i) => `${i + 1}. ${s}`).join('\n')
        const more = sites.length > MAX_ITEMS ? `\n\n…dan ${sites.length - MAX_ITEMS} lainnya` : ''
        await notifReply(`Web yang didukung bypass (${sites.length}):\n\n${shown}${more}`, TITLE)
    } catch (e) {
        console.error('[bypassweb error]', e)
        await notifReply(e instanceof ApiError ? e.message : `Gagal: ${e.message}`, TITLE)
    }
}

handler.command = ['bypassweb']
handler.desc = 'Daftar web yang didukung bypass link'
handler.tags = ['tools']

export default handler