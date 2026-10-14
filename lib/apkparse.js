/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { unzipSync } from 'fflate'

// Pembaca metadata APK (hanya MEMBACA). Tidak memodifikasi, meng-inject, atau mengambil credential.
// AndroidManifest.xml di APK berformat AXML biner; parser minimal di bawah ini cukup untuk metadata dasar.
const u16 = (b, o) => b.readUInt16LE(o)
const u32 = (b, o) => b.readUInt32LE(o)

function readStringPool(b, off) {
    const count = u32(b, off + 8), flags = u32(b, off + 16), strStart = u32(b, off + 20)
    const utf8 = (flags & 0x100) !== 0
    if (count > 200000) throw new Error('string pool terlalu besar')
    const strings = new Array(count)
    for (let i = 0; i < count; i++) {
        let p = off + strStart + u32(b, off + 28 + i * 4)
        if (p >= b.length) { strings[i] = ''; continue }
        if (utf8) {
            let n = b[p++]; if (n & 0x80) n = ((n & 0x7f) << 8) | b[p++]
            let l = b[p++]; if (l & 0x80) l = ((l & 0x7f) << 8) | b[p++]
            strings[i] = b.toString('utf8', p, Math.min(b.length, p + l))
        } else {
            let n = u16(b, p); p += 2
            if (n & 0x8000) { n = ((n & 0x7fff) << 16) | u16(b, p); p += 2 }
            strings[i] = b.toString('utf16le', p, Math.min(b.length, p + n * 2))
        }
    }
    return strings
}

export function parseManifest(b) {
    if (b.length < 16 || u16(b, 0) !== 0x0003) throw new Error('AndroidManifest.xml bukan format AXML yang dikenal')
    let off = u16(b, 2), strings = []
    const out = { package: '', versionName: '', versionCode: '', minSdk: '', targetSdk: '', label: '', labelIsResource: false, permissions: [], debuggable: null, allowBackup: null, cleartext: null }
    let guard = 0
    while (off + 8 <= b.length && guard++ < 200000) {
        const type = u16(b, off), size = u32(b, off + 4)
        if (size < 8 || off + size > b.length) break
        if (type === 0x0001) strings = readStringPool(b, off)
        else if (type === 0x0102) {
            const name = strings[u32(b, off + 20)] || ''
            const attrStart = u16(b, off + 24), attrSize = u16(b, off + 26), attrCount = u16(b, off + 28)
            const attrs = {}
            for (let i = 0; i < Math.min(attrCount, 200); i++) {
                const a = off + 16 + attrStart + i * attrSize
                if (a + 20 > b.length) break
                const an = strings[u32(b, a + 4)] || ''
                const raw = u32(b, a + 8), dt = b[a + 15], data = u32(b, a + 16)
                let val
                if (dt === 0x03) val = strings[data] ?? (raw !== 0xffffffff ? strings[raw] : '')
                else if (dt === 0x12) val = data !== 0
                else if (dt === 0x10 || dt === 0x11) val = data
                else if (dt === 0x01) val = { ref: data }
                else val = raw !== 0xffffffff ? strings[raw] : data
                attrs[an] = val
            }
            if (name === 'manifest') {
                out.package = String(attrs.package || '')
                out.versionName = String(attrs.versionName ?? '')
                out.versionCode = String(attrs.versionCode ?? '')
            } else if (name === 'uses-sdk') {
                out.minSdk = String(attrs.minSdkVersion ?? '')
                out.targetSdk = String(attrs.targetSdkVersion ?? '')
            } else if (name === 'application') {
                if (typeof attrs.label === 'string') out.label = attrs.label
                else if (attrs.label && attrs.label.ref !== undefined) out.labelIsResource = true
                if (typeof attrs.debuggable === 'boolean') out.debuggable = attrs.debuggable
                if (typeof attrs.allowBackup === 'boolean') out.allowBackup = attrs.allowBackup
                if (typeof attrs.usesCleartextTraffic === 'boolean') out.cleartext = attrs.usesCleartextTraffic
            } else if ((name === 'uses-permission' || name === 'uses-permission-sdk-23') && typeof attrs.name === 'string') {
                if (out.permissions.length < 300) out.permissions.push(attrs.name)
            }
        }
        off += size
    }
    if (!out.package) throw new Error('package name tidak ditemukan di manifest')
    return out
}

// Baca APK dari buffer: manifest + daftar isi (tanpa mengekstrak semuanya) + kandidat ikon.
export function readApk(buffer) {
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error('File bukan APK/ZIP yang valid.')
    const names = []
    let manifestBuf = null
    const iconCandidates = []
    let files
    try {
        files = unzipSync(new Uint8Array(buffer), {
            filter: (f) => {
                if (names.length < 50000) names.push({ name: f.name, size: f.originalSize })
                if (f.name === 'AndroidManifest.xml') return true
                if (/^res\/(mipmap|drawable)[^/]*\/ic_launcher[^/]*\.(png|webp)$/i.test(f.name) && f.originalSize < 2 * 1024 * 1024) { iconCandidates.push(f.name); return true }
                return false
            }
        })
    } catch (e) { throw new Error('APK rusak / tidak bisa dibuka sebagai ZIP.') }
    if (files['AndroidManifest.xml']) manifestBuf = Buffer.from(files['AndroidManifest.xml'])
    if (!manifestBuf) throw new Error('AndroidManifest.xml tidak ditemukan — ini bukan APK (mungkin XAPK/APKS/AAB).')
    const manifest = parseManifest(manifestBuf)

    // Ikon terbesar (dari nama folder: xxxhdpi > xxhdpi > ... ) atau file terbesar
    const rank = (n) => ['xxxhdpi', 'xxhdpi', 'xhdpi', 'hdpi', 'mdpi'].findIndex(d => n.includes(d))
    const icon = iconCandidates.map(n => ({ n, r: rank(n) < 0 ? 9 : rank(n), sz: files[n]?.length || 0 })).sort((a, b) => a.r - b.r || b.sz - a.sz)[0]

    const dex = names.filter(x => /^classes\d*\.dex$/.test(x.name)).length
    const abis = [...new Set(names.map(x => x.name.match(/^lib\/([^/]+)\//)?.[1]).filter(Boolean))]
    const signed = names.some(x => /^META-INF\/[^/]+\.(RSA|DSA|EC)$/i.test(x.name))
    return {
        manifest, entries: names.length, dex, abis,
        hasArsc: names.some(x => x.name === 'resources.arsc'),
        assets: names.filter(x => x.name.startsWith('assets/')).length,
        v1Signature: signed,
        iconBuffer: icon ? Buffer.from(files[icon.n]) : null, iconName: icon?.n || null,
        totalUncompressed: names.reduce((s, x) => s + (x.size || 0), 0)
    }
}

// Indikator risiko DASAR dari metadata — bukan antivirus, tidak menjamin aman/berbahaya.
const HIGH = {
    'android.permission.READ_SMS': 'Baca SMS', 'android.permission.RECEIVE_SMS': 'Terima SMS', 'android.permission.SEND_SMS': 'Kirim SMS',
    'android.permission.BIND_ACCESSIBILITY_SERVICE': 'Layanan aksesibilitas', 'android.permission.BIND_DEVICE_ADMIN': 'Admin perangkat',
    'android.permission.SYSTEM_ALERT_WINDOW': 'Tampil di atas aplikasi lain', 'android.permission.REQUEST_INSTALL_PACKAGES': 'Pasang aplikasi lain',
    'android.permission.READ_CALL_LOG': 'Baca riwayat panggilan', 'android.permission.MANAGE_EXTERNAL_STORAGE': 'Akses semua file',
    'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE': 'Baca notifikasi', 'android.permission.READ_CONTACTS': 'Baca kontak'
}
const MEDIUM = {
    'android.permission.RECORD_AUDIO': 'Rekam audio', 'android.permission.CAMERA': 'Kamera', 'android.permission.ACCESS_FINE_LOCATION': 'Lokasi presisi',
    'android.permission.READ_PHONE_STATE': 'Status telepon', 'android.permission.QUERY_ALL_PACKAGES': 'Daftar semua aplikasi', 'android.permission.WRITE_SETTINGS': 'Ubah pengaturan sistem',
    'android.permission.RECEIVE_BOOT_COMPLETED': 'Jalan otomatis saat boot'
}
export function basicScan(info) {
    const { manifest: mf } = info
    const perms = new Set(mf.permissions)
    const high = Object.entries(HIGH).filter(([k]) => perms.has(k)).map(([, v]) => v)
    const med = Object.entries(MEDIUM).filter(([k]) => perms.has(k)).map(([, v]) => v)
    const notes = []
    if (!info.v1Signature) notes.push('Tidak ada berkas tanda tangan v1 di META-INF (bisa saja memakai v2/v3 — tidak terdeteksi oleh parser ini)')
    if (mf.debuggable === true) notes.push('Aplikasi berstatus debuggable')
    if (mf.cleartext === true) notes.push('Mengizinkan lalu lintas HTTP tanpa enkripsi')
    if (info.dex > 3) notes.push(`Banyak berkas dex (${info.dex})`)
    const score = high.length * 2 + med.length + (mf.debuggable ? 1 : 0)
    const level = high.length >= 3 || score >= 7 ? 'TINGGI' : score >= 3 ? 'SEDANG' : 'RENDAH'
    return { level, high, med, notes }
}