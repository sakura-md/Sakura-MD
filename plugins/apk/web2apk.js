/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { cmd, react } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { checkCooldown, resetCooldown, acquireLock, releaseLock } from '../../lib/cooldown.js'
import { findMedia, tooBig } from '../../lib/media.js'
import { randomToken } from '../../lib/cache.js'
import { ApiError, formatBytes } from '../../lib/api.js'
import { buildApk, missingTools, validPackage, normalizeUrl, defaultIcon } from '../../lib/scrape/web2apk.js'

const TITLE = 'Web2APK'

// .web2apk NamaApp | https://situs.com | com.nama.app   (+ kirim/reply gambar sebagai ikon, opsional)
const web2apk = cmd({ command: ['web2apk', 'webtoapk', 'buatapk'], desc: 'Ubah website jadi aplikasi APK', tags: ['apk'], title: TITLE }, async (m, { conn, text, prefix, notifReply }) => {
    const pfx = pfxOf(prefix)
    const [rawName, rawUrl, rawPkg] = text.split('|').map(s => s.trim())
    const usage = `Contoh:\n${pfx}web2apk Toko Saya | https://tokosaya.com | com.tokosaya.app\n\n• Kirim atau reply gambar untuk jadi ikon (opsional)\n• Package boleh dikosongkan, dibuat otomatis`

    if (!rawName || !rawUrl) return notifReply(usage, TITLE)
    const appName = rawName.replace(/[\u0000-\u001f<>"'`\\]/g, '').slice(0, 30).trim()
    if (!appName) return notifReply('Nama aplikasi tidak valid.', TITLE)
    const url = normalizeUrl(rawUrl)
    if (!url) return notifReply('URL tidak valid. Harus diawali http:// atau https://', TITLE)
    const packageName = (rawPkg || `com.sakura.app${randomToken(8)}`).toLowerCase()
    if (!validPackage(packageName)) return notifReply('Package tidak valid. Contoh: com.nama.aplikasi (huruf/angka/underscore, dipisah titik).', TITLE)

    let icon
    const media = findMedia(m, ['image'])
    if (media) {
        if (tooBig(media, config.limits?.maxImageMB ?? 10)) return notifReply(`Gambar ikon terlalu besar (maks ${config.limits?.maxImageMB ?? 10} MB).`, TITLE)
        icon = await media.download()
    }

    const key = `web2apk:${m.sender}`
    if (!m.isOwner) {
        const cd = checkCooldown(key, config.limits?.cooldown?.web2apk ?? 120)
        if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum membuat APK lagi.`, TITLE)
    }
    if (!acquireLock(key)) return notifReply('Pembuatan APK kamu sebelumnya masih berjalan.', TITLE)

    try {
        const missing = await missingTools()
        if (missing.length) throw new ApiError(`Server belum punya: ${missing.join(', ')}. Pasang JDK + Android build-tools (apksigner) dulu.`, { code: 'W2A_TOOLS' })

        await react(conn, m, '⏳')
        await notifReply(`🔨 Membuat APK *${appName}*...\nProses pertama bisa lebih lama (mengunduh komponen).`, TITLE)
        const apk = await buildApk({ appName, url, packageName, icon: icon || await defaultIcon(appName) })
        const safe = appName.replace(/[^a-zA-Z0-9]/g, '') || 'app'

        await conn.sendMessage(m.chat, {
            document: apk,
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${safe}.apk`,
            caption: box('APK SIAP', [`Nama    : ${appName}`, `URL     : ${url}`, `Package : ${packageName}`, `Ukuran  : ${formatBytes(apk.length)}`])
        }, { quoted: m })
        await react(conn, m, '✅')
    } catch (e) {
        console.error('[web2apk] error:', e?.message || e)
        if (!m.isOwner) resetCooldown(key)
        await react(conn, m, '❌')
        await notifReply(box('❌ GAGAL', ['Pembuatan APK gagal.', '', `Detail: ${e instanceof ApiError ? e.message : String(e?.message || e).split('\n')[0].slice(0, 160)}`]), TITLE)
    } finally { releaseLock(key) }
})

export default web2apk
