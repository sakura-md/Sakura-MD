/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Perhitungan kalender Jawa & zodiak (murni lokal, tanpa API).
// Pasaran dihitung dari patokan 1 Jan 1970 = Kamis Wage (diverifikasi: 17 Agt 1945 = Jumat Legi).
export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon']
export const NEPTU_HARI = { Minggu: 5, Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9 }
export const NEPTU_PASARAN = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 }
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Parse "17-08-1945", "17/8/1945", "1945-08-17" -> Date (UTC tengah hari, aman dari geser zona waktu)
export function parseDate(input) {
    const s = String(input || '').trim()
    let d, mo, y
    let m = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/)
    if (m) { d = +m[1]; mo = +m[2]; y = +m[3] } else {
        m = s.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/)
        if (!m) return null
        y = +m[1]; mo = +m[2]; d = +m[3]
    }
    if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null
    const date = new Date(Date.UTC(y, mo - 1, d, 12))
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
    return date
}

export function weton(date) {
    const days = Math.floor(date.getTime() / 86400000)
    const hari = HARI[date.getUTCDay()]
    const pasaran = PASARAN[(((days + 3) % 5) + 5) % 5]
    const neptu = NEPTU_HARI[hari] + NEPTU_PASARAN[pasaran]
    return { hari, pasaran, neptuHari: NEPTU_HARI[hari], neptuPasaran: NEPTU_PASARAN[pasaran], neptu }
}

export function todayJakarta() {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number)
    return new Date(Date.UTC(p[0], p[1] - 1, p[2], 12))
}

export const fmtDate = (date) => `${date.getUTCDate()} ${BULAN[date.getUTCMonth()]} ${date.getUTCFullYear()}`

const ZODIAK = [
    ['Capricorn', 12, 22, 1, 19], ['Aquarius', 1, 20, 2, 18], ['Pisces', 2, 19, 3, 20], ['Aries', 3, 21, 4, 19],
    ['Taurus', 4, 20, 5, 20], ['Gemini', 5, 21, 6, 20], ['Cancer', 6, 21, 7, 22], ['Leo', 7, 23, 8, 22],
    ['Virgo', 8, 23, 9, 22], ['Libra', 9, 23, 10, 22], ['Scorpio', 10, 23, 11, 21], ['Sagittarius', 11, 22, 12, 21]
]
export function zodiak(date) {
    const mo = date.getUTCMonth() + 1, d = date.getUTCDate()
    return ZODIAK.find(([, m1, d1, m2, d2]) => (mo === m1 && d >= d1) || (mo === m2 && d <= d2))?.[0] || 'Capricorn'
}

const SHIO = ['Monyet', 'Ayam', 'Anjing', 'Babi', 'Tikus', 'Kerbau', 'Macan', 'Kelinci', 'Naga', 'Ular', 'Kuda', 'Kambing']
export const shio = (year) => SHIO[year % 12]

export const SIFAT_PASARAN = {
    Legi: 'cenderung ramah, murah hati, dan mudah bergaul.',
    Pahing: 'gigih, mandiri, dan punya tekad kuat.',
    Pon: 'tenang, teliti, dan suka memikirkan sesuatu matang-matang.',
    Wage: 'tertutup namun setia, tekun, dan pekerja keras.',
    Kliwon: 'peka, intuitif, dan punya daya tarik tersendiri.'
}
export const SIFAT_HARI = {
    Minggu: 'berjiwa pemimpin dan suka jadi pusat perhatian.',
    Senin: 'lembut, perasa, dan mudah berempati.',
    Selasa: 'berani, tegas, dan penuh semangat.',
    Rabu: 'cerdas, komunikatif, dan cepat beradaptasi.',
    Kamis: 'bijaksana, dermawan, dan suka membimbing.',
    Jumat: 'penyayang, menyukai keindahan, dan mudah disukai.',
    Sabtu: 'disiplin, sabar, dan bertanggung jawab.'
}

// Kategori kecocokan tradisional: jumlah neptu kedua orang dibagi 4
export const JODOH = {
    1: ['Pegat', 'Perlu banyak saling pengertian; hindari memendam masalah.'],
    2: ['Ratu', 'Dipandang saling menghormati dan disegani lingkungan.'],
    3: ['Jodoh', 'Dipandang serasi dan saling melengkapi.'],
    0: ['Topo', 'Dipandang perlu kesabaran di awal, lalu makin kuat seiring waktu.']
}

export function hashStr(s) {
    let h = 2166136261
    for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0 }
    return h >>> 0
}