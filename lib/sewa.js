/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { getDb, saveDb } from './db.js'

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000
const ONE_DAY = 24 * 60 * 60 * 1000
const CHECK_INTERVAL = 60 * 1000
// Setelah .delsewa, owner masih punya waktu segini untuk .addsewa lagi sebelum bot keluar.
export const GRACE_MS = 10 * 60 * 1000

// Hanya satu scheduler yang boleh aktif. Scheduler milik socket lama
// berhenti sendiri begitu ada socket baru (mencegah error "Connection Closed").
let activeConn = null

// true kalau websocket Baileys sedang terbuka. Kalau status tidak bisa dibaca, anggap terbuka.
function isConnected(conn) {
    const ws = conn?.ws
    if (!ws) return true
    if (typeof ws.isOpen === 'boolean') return ws.isOpen
    if (typeof ws.readyState === 'number') return ws.readyState === 1
    return true
}

const db = () => getDb('sewa', {
    enforce: true,
    groups: {},
    grace: {}
})

export const sewaState = () => db()
export const saveSewa = () => saveDb('sewa')

function log(message) {
    console.log(`╭━━〔 🌸 SAKURA SEWA 〕━━⬣
┃ ${message}
╰━━━━━━━━━━━━━━━━━━⬣`)
}

export function getRental(groupId) {
    const rental = db().groups?.[groupId]
    if (!rental) return null

    if (
        !rental.permanent &&
        Number(rental.expireDate) <= Date.now()
    ) {
        return {
            ...rental,
            expired: true
        }
    }

    return rental
}

export function isActive(groupId) {
    const rental = getRental(groupId)
    return Boolean(rental && !rental.expired)
}

export function isSewaBlocked(groupId) {
    return !isActive(groupId)
}

// ---- Paket sewa -------------------------------------------------------
export const PLAN_NAMES = ['Biasa', 'Medium', 'Premium']

const PLAN_ALIASES = {
    biasa: 'Biasa', basic: 'Biasa', normal: 'Biasa', reguler: 'Biasa', regular: 'Biasa',
    medium: 'Medium', mid: 'Medium', menengah: 'Medium',
    premium: 'Premium', prem: 'Premium', vip: 'Premium'
}

// "premium" / "PREM" / "vip" -> "Premium" (null kalau bukan nama paket)
export function normalizePlan(input) {
    return PLAN_ALIASES[String(input ?? '').trim().toLowerCase()] || null
}

// ---- Durasi -----------------------------------------------------------
const UNIT_TABLE = [
    { names: ['s', 'sec', 'detik', 'dtk'], ms: 1000, label: 'detik' },
    { names: ['m', 'min', 'menit', 'mnt'], ms: 60 * 1000, label: 'menit' },
    { names: ['h', 'jam'], ms: 60 * 60 * 1000, label: 'jam' },
    { names: ['d', 'hari'], ms: ONE_DAY, label: 'hari' },
    { names: ['w', 'minggu', 'mg'], ms: 7 * ONE_DAY, label: 'minggu' },
    { names: ['bulan', 'bln', 'mo'], ms: 30 * ONE_DAY, label: 'bulan' }
]
const UNIT_LOOKUP = new Map(UNIT_TABLE.flatMap(u => u.names.map(n => [n, u])))
const MAX_RENTAL_MS = 3650 * ONE_DAY // batas 10 tahun supaya tanggal tidak overflow

export const PERMANENT_WORDS = ['permanent', 'permanen', 'perm', 'selamanya', 'unlimited']

// Contoh valid: 30d, 12h, 60s, 15m, 2w, 1bulan, "30 hari", 30 (angka saja = hari), permanent
export function parseDuration(input) {
    const value = String(input ?? '').trim().toLowerCase()

    if (PERMANENT_WORDS.includes(value)) {
        return { permanent: true, ms: 0, label: 'Permanen' }
    }

    const match = value.match(/^(\d{1,9})\s*([a-z]*)$/)
    if (!match) return null

    const amount = Number(match[1])
    if (!Number.isSafeInteger(amount) || amount < 1) return null

    const unit = match[2] ? UNIT_LOOKUP.get(match[2]) : UNIT_LOOKUP.get('d')
    if (!unit) return null

    const ms = amount * unit.ms
    if (!Number.isSafeInteger(ms) || ms > MAX_RENTAL_MS) return null

    return { permanent: false, ms, label: `${amount} ${unit.label}` }
}

// Cari grup target dari argumen: ID (xxx@g.us), link undangan, atau grup tempat command dipakai.
// `rest` = argumen sisanya (paket, durasi, dll).
export async function resolveSewaTarget(conn, m, args = []) {
    const rest = []
    let groupId = null
    let invalid = false

    for (const token of args.map(String)) {
        const id = token.match(/(\d{5,}(?:-\d+)?@g\.us)/)
        const link = token.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{10,})/i)

        if (id) {
            groupId = id[1]
        } else if (link) {
            const info = await conn.groupGetInviteInfo(link[1]).catch(() => null)
            if (info?.id) groupId = info.id
            else invalid = true
        } else {
            rest.push(token)
        }
    }

    if (!groupId && !invalid && m.isGroup) groupId = m.chat
    return { groupId, rest, invalid }
}

export function addRental(
    groupId,
    ownerId,
    days = 30,
    plan = 'Biasa'
) {
    const amount = Number(days)

    if (!Number.isFinite(amount) || amount < 1) {
        throw new Error('Durasi sewa harus minimal 1 hari.')
    }

    return addRentalDuration(
        groupId,
        ownerId,
        `${amount}d`,
        plan
    )
}

export function addPermanentRental(
    groupId,
    ownerId,
    plan = 'Premium'
) {
    return addRentalDuration(
        groupId,
        ownerId,
        'permanent',
        plan
    )
}

export function addRentalDuration(
    groupId,
    ownerId,
    duration,
    plan = 'Biasa'
) {
    if (!groupId) {
        throw new Error('ID grup tidak valid.')
    }

    const parsed = parseDuration(duration)

    if (!parsed) {
        throw new Error(
            'Durasi tidak valid. Contoh: 60s, 12h, 30d, atau permanent.'
        )
    }

    if (isActive(groupId)) {
        throw Object.assign(new Error('Grup ini masih memiliki sewa aktif.'), { code: 'ACTIVE' })
    }

    const state = db()
    state.groups ??= {}

    const now = Date.now()

    state.groups[groupId] = {
        groupId,
        ownerId: ownerId ?? null,
        plan: normalizePlan(plan) || 'Biasa',
        startDate: now,
        expireDate: parsed.permanent ? null : now + parsed.ms,
        permanent: parsed.permanent,
        reminder2DaysSent: false,
        expiredNoticeSent: false,
        leftAt: null
    }

    if (state.grace) delete state.grace[groupId]

    saveSewa()

    log(`Sewa ditambahkan: ${groupId}`)

    return state.groups[groupId]
}

export function extendRental(groupId, duration, plan = null) {
    const rental = db().groups?.[groupId]

    if (!rental) {
        throw new Error('Data sewa tidak ditemukan.')
    }

    if (rental.permanent) {
        throw new Error('Sewa grup ini sudah permanen.')
    }

    const parsed = parseDuration(duration)

    if (!parsed) {
        throw new Error(
            'Durasi tidak valid. Contoh: 12h, 30d, atau permanent.'
        )
    }

    if (parsed.permanent) {
        rental.permanent = true
        rental.expireDate = null
    } else {
        const base = Math.max(
            Number(rental.expireDate) || 0,
            Date.now()
        )

        rental.expireDate = base + parsed.ms
    }

    const newPlan = normalizePlan(plan)
    if (newPlan) rental.plan = newPlan

    rental.reminder2DaysSent = false
    rental.expiredNoticeSent = false
    rental.leftAt = null

    saveSewa()

    log(`Sewa diperpanjang: ${groupId}`)

    return rental
}

// Hapus sewa. Bot TIDAK langsung keluar: grup masuk masa tenggang GRACE_MS (10 menit).
// Kalau dalam masa itu sewa ditambahkan lagi (.addsewa), keluar dibatalkan; kalau tidak, scheduler mengeluarkan bot.
export function delRental(groupId) {
    const state = db()

    if (!state.groups?.[groupId]) return false

    delete state.groups[groupId]
    state.grace ??= {}
    state.grace[groupId] = Date.now() + GRACE_MS
    saveSewa()

    log(`Sewa dihapus: ${groupId} (tenggang ${GRACE_MS / 60000} menit)`)

    return true
}

// Sisa masa tenggang (ms) setelah .delsewa; 0 kalau tidak sedang dalam tenggang.
export function graceLeftMs(groupId) {
    const until = Number(db().grace?.[groupId]) || 0
    return Math.max(0, until - Date.now())
}

export const inGrace = groupId => graceLeftMs(groupId) > 0

export function listRentals() {
    return Object.entries(db().groups ?? {})
        .filter(([, r]) => r)
        .map(([groupId, r]) => ({ groupId, ...getRental(groupId) }))
        .sort((x, y) => {
            if (!!x.expired !== !!y.expired) return x.expired ? 1 : -1
            const ex = x.permanent ? Infinity : Number(x.expireDate)
            const ey = y.permanent ? Infinity : Number(y.expireDate)
            return ex - ey
        })
}

export function daysLeft(groupId) {
    const rental = getRental(groupId)

    if (!rental) return 0
    if (rental.permanent) return Infinity
    if (rental.expired) return 0

    return Math.ceil(
        (Number(rental.expireDate) - Date.now()) / ONE_DAY
    )
}

export function timeLeftMs(groupId) {
    const rental = getRental(groupId)

    if (!rental) return 0
    if (rental.permanent) return Infinity
    if (rental.expired) return 0

    return Math.max(
        0,
        Number(rental.expireDate) - Date.now()
    )
}

export function formatDate(timestamp) {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'long',
        timeStyle: 'short'
    })
}

export function formatRemaining(ms) {
    if (ms === Infinity) return 'Permanen ♾️'
    if (ms <= 0) return 'Sudah berakhir'

    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    const parts = []

    if (days) parts.push(`${days} hari`)
    if (hours) parts.push(`${hours} jam`)
    if (minutes && parts.length < 2) {
        parts.push(`${minutes} menit`)
    }

    return parts.join(' ') || 'kurang dari 1 menit'
}

async function leaveGroup(conn, groupId) {
    if (!isConnected(conn)) return false

    try {
        await conn.groupLeave(groupId)

        log(`Bot keluar dari grup: ${groupId}`)

        return true
    } catch (error) {
        console.error(
            `[SEWA] Gagal keluar dari ${groupId}:`,
            error?.message || error
        )

        return false
    }
}

export async function enforceGroupSewa(conn, groupId) {
    const rental = getRental(groupId)

    if (rental && !rental.expired) return true
    if (inGrace(groupId)) return true

    log(`Grup tanpa sewa aktif: ${groupId}`)

    await leaveGroup(conn, groupId)

    return false
}

export async function handleSewaGroupJoin(conn, event) {
    if (!event || event.action !== 'add') return

    try {
        const botJid = conn.user?.id
        if (!botJid) return

        const participants = event.participants ?? []
        const botNumber = botJid.split(':')[0].split('@')[0]

        const botWasAdded = participants.some(participant => {
            const jid = typeof participant === 'string'
                ? participant
                : participant?.id

            if (!jid) return false

            return jid === botJid ||
                jid.split(':')[0].split('@')[0] === botNumber
        })

        if (!botWasAdded) return

        await enforceGroupSewa(conn, event.id)
    } catch (error) {
        console.error(
            '[SEWA] Kesalahan saat bot masuk grup:',
            error?.message || error
        )
    }
}

async function processRental(conn, groupId, rental) {
    if (rental.permanent) return

    const expireDate = Number(rental.expireDate)
    const remaining = expireDate - Date.now()

    // Sewa telah berakhir.
    if (remaining <= 0) {
        if (!rental.expiredNoticeSent) {
            try {
                await conn.sendMessage(groupId, {
                    text: `╭━━〔 ❌ *SEWA BERAKHIR* 〕━━⬣
┃
┃ Masa sewa grup ini telah berakhir.
┃ Bot akan keluar otomatis.
┃
┃ 📅 Berakhir: ${formatDate(expireDate)}
┃
┃ 💳 Hubungi owner untuk memperpanjang.
╰━━━━━━━━━━━━━━━━━━⬣`
                })
            } catch (error) {
                console.error(
                    `[SEWA] Gagal mengirim pemberitahuan ${groupId}:`,
                    error?.message || error
                )
            }

            rental.expiredNoticeSent = true
            saveSewa()
        }

        // Keluar cukup sekali. Kalau bot masuk lagi, handleSewaGroupJoin / sapuan berkala yang menanganinya.
        // leftAt hanya diisi kalau keluar benar-benar berhasil; kalau gagal, coba lagi paling cepat 10 menit kemudian.
        if (!rental.leftAt && Date.now() >= Number(rental.leaveRetryAt || 0)) {
            if (await leaveGroup(conn, groupId)) {
                rental.leftAt = Date.now()
                delete rental.leaveRetryAt
            } else {
                rental.leaveRetryAt = Date.now() + 10 * 60 * 1000
            }
            saveSewa()
        }

        return
    }

    // Pengingat sebelum berakhir: maks. 2 hari, untuk sewa pendek 1/3 dari total durasi.
    // Sewa < 3 jam tidak diberi pengingat (kalau tidak, pengingat langsung terkirim saat sewa dibuat).
    const total = expireDate - Number(rental.startDate || 0)
    const threshold = Math.min(TWO_DAYS, Math.floor(total / 3))

    if (
        total >= 3 * 60 * 60 * 1000 &&
        remaining <= threshold &&
        !rental.reminder2DaysSent
    ) {
        try {
            await conn.sendMessage(groupId, {
                text: `╭━━〔 ⚠️ *PENGINGAT SEWA* 〕━━⬣
┃
┃ ⏳ Masa sewa grup akan segera berakhir!
┃
┃ 🕒 Sisa waktu: ${formatRemaining(remaining)}
┃ 📅 Expired: ${formatDate(expireDate)}
┃
┃ 💳 Silakan perpanjang masa sewa
┃ sebelum bot keluar otomatis.
╰━━━━━━━━━━━━━━━━━━⬣`
            })

            log(`Pengingat terkirim: ${groupId}`)
        } catch (error) {
            console.error(
                `[SEWA] Gagal mengirim pengingat ${groupId}:`,
                error?.message || error
            )
        }

        // Tandai terkirim walau gagal, supaya tidak mengulang tiap menit.
        rental.reminder2DaysSent = true
        saveSewa()
    }
}

// Hentikan scheduler milik satu socket (aman dipanggil berulang / dengan null).
export function stopSewaScheduler(conn) {
    if (!conn) return

    if (conn.__sewaScheduler) {
        clearInterval(conn.__sewaScheduler)
        conn.__sewaScheduler = null
    }

    conn.__sewaInitialized = false

    if (activeConn === conn) activeConn = null
}

export function startSewaScheduler(conn) {
    if (!conn) {
        throw new Error('Koneksi WhatsApp tidak tersedia.')
    }

    stopSewaScheduler(activeConn)
    activeConn = conn

    let tick = 0

    const run = async () => {
        // Socket ini sudah diganti socket baru: hentikan scheduler lamanya.
        if (activeConn !== conn) {
            stopSewaScheduler(conn)
            return
        }

        // Koneksi sedang putus / menyambung ulang: lewati tick ini, tidak perlu error.
        if (!isConnected(conn)) return

        try {
            const state = db()
            const groups = Object.entries(state.groups ?? {})

            for (const [groupId, rental] of groups) {
                if (!rental) continue

                try {
                    await processRental(conn, groupId, rental)
                } catch (error) {
                    console.error(
                        `[SEWA] Error memproses ${groupId}:`,
                        error?.message || error
                    )
                }
            }

            // Masa tenggang setelah .delsewa: sewa ditambahkan lagi -> batal keluar; waktu habis -> bot keluar.
            for (const [groupId, until] of Object.entries(state.grace ?? {})) {
                if (isActive(groupId)) {
                    delete state.grace[groupId]
                    saveSewa()
                    continue
                }

                if (Date.now() >= Number(until)) {
                    delete state.grace[groupId]
                    saveSewa()
                    log(`Masa tenggang habis, bot keluar: ${groupId}`)
                    await leaveGroup(conn, groupId)
                }
            }

            // Sapuan grup yang tidak punya sewa: tiap 10 menit saja (fetch semua grup tiap menit rawan rate-limit).
            const sweep = tick++ % 10 === 0

            if (
                sweep &&
                typeof conn.groupFetchAllParticipating === 'function'
            ) {
                const participating =
                    await conn.groupFetchAllParticipating()

                for (const groupId of Object.keys(participating ?? {})) {
                    if (!isActive(groupId) && !inGrace(groupId)) {
                        await leaveGroup(conn, groupId)
                    }
                }
            }
        } catch (error) {
            const message = error?.message || String(error)

            if (/connection closed|not open|connection lost/i.test(message)) {
                tick = 0 // ulangi sapuan begitu koneksi pulih
                log('Koneksi terputus, pemeriksaan diulang setelah tersambung kembali.')
            } else {
                console.error('[SEWA] Scheduler error:', message)
            }
        }
    }

    run().catch(error => {
        console.error('[SEWA]', error?.message || error)
    })

    conn.__sewaScheduler = setInterval(() => {
        run().catch(error => {
            console.error('[SEWA]', error?.message || error)
        })
    }, CHECK_INTERVAL)

    log('Scheduler aktif — pemeriksaan setiap 60 detik.')

    return conn.__sewaScheduler
}

// Pasang sistem sewa dari satu fungsi saja.
export async function initSewa(conn) {
    if (!conn) {
        throw new Error('Koneksi WhatsApp tidak tersedia.')
    }

    if (conn.__sewaInitialized) {
        return conn.__sewaScheduler ?? null
    }

    conn.__sewaInitialized = true

    conn.ev.on('group-participants.update', event => {
        handleSewaGroupJoin(conn, event).catch(error => {
            console.error(
                '[SEWA] Gagal memeriksa event grup:',
                error?.message || error
            )
        })
    })

    try {
        return startSewaScheduler(conn)
    } catch (error) {
        conn.__sewaInitialized = false
        throw error
    }
}