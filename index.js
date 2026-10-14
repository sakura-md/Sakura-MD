/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Harus jadi import pertama: menjalankan bot di bawah supervisor (auto restart).
import './lib/supervisor.js'
import readline from 'readline'
import pino from 'pino'
import chalk from 'chalk'
import * as baileys from '@sakuraa/baileys'
import config from './config.js'
import { loadRuntimeSettings } from './lib/settings.js'
import { smsg } from './lib/myfunc.js'
import { installLidSupport, resolveMessageLids } from './lib/lid.js'
import { trackMessage } from './lib/activity.js'
import handleMessage, { initPlugins } from './handler.js'
import { onParticipants } from './lib/guard.js'
import { initSewa, stopSewaScheduler } from './lib/sewa.js'
import { startAutoRestart } from './lib/autorestart.js'
import { patchInapp } from './lib/inapp.js'
import { setupSendButtons } from './lib/sendButtons.js'
import logger, { installConsole } from './lib/logger.js'

installConsole()

const {
    useMultiFileAuthState,
    DisconnectReason,
    jidDecode,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers
} = baileys

const makeWASocket =
    baileys.makeWASocket ||
    baileys.default?.makeWASocket ||
    baileys.default

loadRuntimeSettings(config)

// Restart otomatis kalau file inti (index.js, handler.js, config.js, lib/) diperbarui.
startAutoRestart(config.autoRestart)

process.on('unhandledRejection', reason => {
    console.error('[unhandledRejection]', reason)
})

process.on('uncaughtException', err => {
    console.error('[uncaughtException]', err)
})

const usePairingCode = true

let rl = null

const question = text =>
    new Promise(resolve => {
        rl ||= readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        rl.question(text, resolve)
    })

const closeReadline = () => {
    if (rl) {
        try {
            rl.close()
        } catch {}
        rl = null
    }
}

// Cache pesan terakhir.
const MSG_CACHE_MAX = 2000
const msgCache = new Map()

const rememberMessage = mek => {
    const id = mek?.key?.id
    if (!id || !mek.message) return

    msgCache.set(id, mek.message)

    if (msgCache.size > MSG_CACHE_MAX) {
        msgCache.delete(msgCache.keys().next().value)
    }
}

// Pengaman pesan duplikat.
const SEEN_TTL = 5 * 60 * 1000
const SEEN_MAX = 5000
const seenMessages = new Map()

const alreadySeen = mek => {
    const k = String(mek?.key?.id)
    const now = Date.now()
    const at = seenMessages.get(k)

    if (at && now - at < SEEN_TTL) return true

    seenMessages.set(k, now)

    if (seenMessages.size > SEEN_MAX) {
        for (const [key, timestamp] of seenMessages) {
            if (
                now - timestamp > SEEN_TTL ||
                seenMessages.size > SEEN_MAX
            ) {
                seenMessages.delete(key)
            } else {
                break
            }
        }
    }

    return false
}

// Satu socket aktif.
let activeSock = null
let reconnectTimer = null

const scheduleReconnect = (delayMs, onError) => {
    if (reconnectTimer) clearTimeout(reconnectTimer)

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connectToWhatsApp().catch(onError)
    }, delayMs)
}

const GROUP_CACHE_TTL = 5 * 60 * 1000
const groupCache = new Map()

const store = { bind() {} }

let pairingPhone = null

const askPhoneNumber = async () => {
    for (;;) {
        const raw = await question(
            '\nSilahkan masukkan nomor (628xxx):\n'
        )

        const digits = String(raw || '').replace(/[^0-9]/g, '')

        if (digits.length >= 8 && digits.length <= 15) {
            return digits
        }

        console.log(
            chalk.red(
                'Nomor tidak valid. Pakai kode negara tanpa +, contoh: 628123456789'
            )
        )
    }
}

let pluginsLoaded = false

async function connectToWhatsApp() {
    if (activeSock) {
        const old = activeSock
        activeSock = null

        // Hentikan scheduler sewa milik socket lama sebelum diganti.
        try {
            stopSewaScheduler(old)
        } catch {}

        try {
            old.ev.removeAllListeners()
        } catch {}

        try {
            old.end(undefined)
        } catch {}
    }

    const { state, saveCreds } =
        await useMultiFileAuthState('./session')

    const { version } = await fetchLatestBaileysVersion()
    const silent = pino({ level: 'silent' })

    const sock = makeWASocket({
        version,
        browser: Browsers?.ubuntu
            ? Browsers.ubuntu('Chrome')
            : ['Ubuntu', 'Chrome', '22.04.4'],
        logger: silent,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                silent
            )
        },
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,

        getMessage: async key => msgCache.get(key?.id),

        cachedGroupMetadata: async jid => {
            const hit = groupCache.get(jid)

            return hit && Date.now() - hit.at < GROUP_CACHE_TTL
                ? hit.data
                : undefined
        }
    })

    activeSock = sock

    const isStale = () => activeSock !== sock

    patchInapp(sock)
    installLidSupport(sock)
    setupSendButtons(sock)

    // Cache metadata grup.
    const origGroupMetadata = sock.groupMetadata.bind(sock)

    sock.groupMetadata = async jid => {
        const data = await origGroupMetadata(jid)

        if (data) {
            groupCache.set(jid, {
                at: Date.now(),
                data
            })
        }

        return data
    }

    sock.ev.on('groups.update', updates => {
        for (const update of updates || []) {
            if (update?.id) groupCache.delete(update.id)
        }
    })

    // Bersihkan cache ketika anggota grup berubah.
    sock.ev.on('group-participants.update', ev => {
        if (ev?.id) groupCache.delete(ev.id)
    })

    sock.decodeJid = jid => {
        if (!jid) return jid

        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}

            return decode.user && decode.server
                ? decode.user + '@' + decode.server
                : jid
        }

        return jid
    }

    store.bind(sock.ev)

    // Pairing code.
    let pairingRequested = false

    const requestPairing = async () => {
        if (
            pairingRequested ||
            sock.authState.creds.registered ||
            !usePairingCode
        ) {
            return
        }

        pairingRequested = true

        try {
            pairingPhone ||= await askPhoneNumber()

            const code = await sock.requestPairingCode(
                pairingPhone,
                'SAKURAMD'
            )

            const shown = String(code).replace(
                /(.{4})(?=.)/g,
                '$1-'
            )

            console.log('')
            console.log(
                chalk.magentaBright(
                    '  ╭────────────────────────────╮'
                )
            )

            console.log(
                chalk.magentaBright('  │ ') +
                chalk.whiteBright.bold('PAIRING CODE :  ') +
                chalk.yellowBright.bold(shown)
            )

            console.log(
                chalk.magentaBright(
                    '  ╰────────────────────────────╯'
                )
            )

            console.log(`  Kode polos  : ${code}`)

            console.log(
                chalk.gray(
                    '  WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon\n'
                )
            )
        } catch (e) {
            pairingRequested = false
            pairingPhone = null

            console.error(
                '[pairing] gagal meminta kode:',
                e?.message || e
            )
        }
    }

    // Pesan masuk.
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (isStale()) return

        for (const mek of messages || []) {
            rememberMessage(mek)
        }

        if (type && type !== 'notify') return

        for (const mek of messages || []) {
            try {
                if (!mek?.message) continue

                if (mek.key?.id && alreadySeen(mek)) continue

                const jid = mek.key?.remoteJid || ''

                if (!jid) continue
                if (jid === 'status@broadcast') continue
                if (jid.endsWith('@newsletter')) continue

                if (
                    mek.key?.id?.startsWith('BAE5') &&
                    mek.key.id.length === 16
                ) {
                    continue
                }

                const m = smsg(sock, mek, store)
                if (!m) continue

                await resolveMessageLids(sock, m)

                if (m.isGroup && !m.fromMe && m.sender) {
                    trackMessage(m.chat, m.sender)
                }

                await handleMessage(sock, m)
            } catch (e) {
                console.log(e)
            }
        }
    })

    // Event peserta grup.
    // Sistem sewa dipasang dari lib/sewa.js melalui initSewa().
    sock.ev.on('group-participants.update', ev => {
        if (isStale()) return

        logger.group(
            String(ev.action || 'update').toUpperCase(),
            `${String(ev.id || '').split('@')[0].slice(-8)} • ${(ev.participants || []).length} peserta`
        )

        Promise.resolve(onParticipants(sock, ev)).catch(err => {
            console.error(
                '[GUARD] Gagal memproses peserta grup:',
                err?.message || err
            )
        })
    })

    sock.public = config.botMode !== 'self'

    // Status koneksi.
    sock.ev.on(
        'connection.update',
        async ({ connection, lastDisconnect, qr }) => {
            if (isStale()) return

            if (qr) requestPairing()

            if (connection === 'connecting') {
                logger.conn('Menghubungkan ke WhatsApp...')
            }

            if (connection === 'open') {
                closeReadline()

                logger.conn(
                    'TERHUBUNG',
                    `sebagai ${sock.user?.name || sock.decodeJid(sock.user?.id) || '-'}`
                )

                const channels = [
                    '120363425496265274@newsletter',
                    '120363428671784813@newsletter',
                    '120363423615787376@newsletter',
                    '120363405741151821@newsletter'
                ].filter(id => /^\d+@newsletter$/.test(id))

                for (const channel of channels) {
                    try {
                        await sock.newsletterFollow(channel)
                    } catch (e) {
                        console.error(
                            '❌ Experiencing an error when following a channel',
                            e?.message || e
                        )
                    }
                }

                if (!pluginsLoaded) {
                    await initPlugins()
                    pluginsLoaded = true

                    logger.ok(
                        'Semua plugin dimuat, bot siap dipakai 🌸'
                    )
                }

                // Semua sistem sewa ditangani oleh lib/sewa.js.
                try {
                    await initSewa(sock)
                } catch (error) {
                    console.error(
                        '[SEWA] Gagal menginisialisasi sistem sewa:',
                        error?.message || error
                    )
                }

                return
            }

            if (connection === 'close') {
                // Koneksi putus: matikan scheduler sewa; dipasang ulang saat 'open'.
                stopSewaScheduler(sock)

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode

                logger.conn(
                    'TERPUTUS',
                    `kode ${statusCode ?? '-'}${statusCode === DisconnectReason.loggedOut
                        ? ' (logout)'
                        : ' — mencoba menyambung ulang'
                    }`
                )

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log(
                        chalk.red(
                            'Sesi logout. Hapus folder ./session lalu jalankan ulang untuk pairing baru.'
                        )
                    )
                    return
                }

                if (
                    statusCode ===
                    DisconnectReason.connectionReplaced
                ) {
                    console.log(
                        chalk.red(
                            'Sesi dipakai di perangkat/proses lain (connection replaced). Tutup proses lain lalu jalankan ulang.'
                        )
                    )
                    return
                }

                const delay =
                    statusCode === DisconnectReason.restartRequired
                        ? 500
                        : 3000

                scheduleReconnect(delay, retryConnect)
            }
        }
    )

    sock.ev.on('creds.update', saveCreds)
}

const retryConnect = e => {
    console.error(
        '[connect] gagal membuat koneksi, coba lagi 5 detik:',
        e?.message || e
    )

    scheduleReconnect(5000, retryConnect)
}

connectToWhatsApp().catch(retryConnect)