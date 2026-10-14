/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import config from './config.js'
import { runGuard, getMeta } from './lib/guard.js'
import { trackCommand } from './lib/users.js'
import { isSewaBlocked } from './lib/sewa.js'
import { hasSession, checkAnswer } from './lib/gamekit.js'
import { sessionOn } from './lib/ai.js'
import logger from './lib/logger.js'
import { makeInappReply } from './lib/inapp.js'
import { isSameJid, isGroupAdminJid, isBotGroupAdmin } from './lib/myfunc.js'
import { box } from './lib/format.js'
import { runAutoblock } from './plugins/owner/autoblock.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = __dirname
export const pluginDir = path.join(__dirname, 'plugins')
const ownerPath = path.join(__dirname, 'database/owner.json')
const premiumPath = path.join(__dirname, 'database/premium.json')
const autoreadPath = path.join(__dirname, 'database/autoread.json')

// [MUTE] Database mute
const mutePath = path.join(__dirname, 'database/mute.json')

// [MUTE] Hapus pesan anggota yang sedang di-mute.
async function deleteMutedMessage(conn, m) {
    if (!m?.isGroup || !m?.chat || !m?.sender || !m?.key || m.fromMe) {
        return false
    }

    // Jangan hapus pesan creator atau owner.
    if (m.isCreator || m.isOwner) return false

    try {
        if (!fs.existsSync(mutePath)) return false

        const db = JSON.parse(fs.readFileSync(mutePath, 'utf8'))
        const mutedUsers = Array.isArray(db[m.chat]) ? db[m.chat] : []

        const normalize = jid =>
            String(jid || '').replace(/:\d+@/, '@')

        // Identitas pengirim yang mungkin tersedia di Baileys 7.
        const senderIds = [
            m.sender,
            m.key.participant,
            m.key.participantAlt,
            m.senderAlt,
            m.key.remoteJidAlt
        ].filter(Boolean).map(normalize)

        const isMuted = mutedUsers.some(jid =>
            senderIds.includes(normalize(jid))
        )

        if (!isMuted) return false

        await conn.sendMessage(m.chat, {
            delete: m.key
        })

        return true
    } catch (e) {
        console.error('[Mute] Gagal menghapus pesan:', e?.message || e)
        return false
    }
}

function isAutoReadEnabled() {
    try {
        return JSON.parse(fs.readFileSync(autoreadPath, 'utf8')).enabled === true
    } catch {
        return false
    }
}

async function autoReadMessage(conn, m) {
    if (!isAutoReadEnabled()) return
    if (m?.fromMe || !m?.key) return
    if (m?.chat?.endsWith('@broadcast') || m?.chat?.endsWith('@newsletter')) return
    try {
        await conn.readMessages([m.key])
    } catch (e) {
        console.error('[AutoRead] Gagal menandai pesan sudah dibaca:', e?.message || e)
    }
}

// Menjalankan handler plugin: cek flag group/admin/botAdmin + tangani error secara seragam.
// Flag diisi di plugin, contoh: handler.group = true, handler.admin = true, handler.botAdmin = true
async function runHandler(handler, m, ctx) {
    const { conn, notifReply } = ctx
    const title = handler.title || 'Sakura-MD'

    try {
        if (handler.group || handler.admin || handler.botAdmin) {
            if (!m.isGroup) return await notifReply('Command ini hanya bisa dipakai di dalam grup', title)

            const meta = await getMeta(conn, m.chat, handler.admin || handler.botAdmin)
            if (!meta) return await notifReply('Gagal mengambil data grup, coba lagi', title)

            if (handler.admin && !m.isOwner && !isGroupAdminJid(meta.participants, m.sender)) {
                return await notifReply('Fitur ini khusus Admin Grup', title)
            }
            if (handler.botAdmin && !isBotGroupAdmin(meta, conn)) {
                return await notifReply('Bot harus jadi Admin Grup dulu untuk memakai fitur ini', title)
            }
            ctx.meta = meta
        }

        return await handler(m, ctx)
    } catch (e) {
        console.error(`[${title}] error:`, e)
        const detail = String(e?.message || 'Kesalahan tidak diketahui').split('\n')[0].slice(0, 200)
        await notifReply(box('❌ GAGAL', ['Terjadi kesalahan saat memproses request', '', `Detail: ${detail}`]), title).catch(() => {})
    }
}

export const plugins = new Map()

const pluginCache = new Map()
const commandOwner = new Map()
const watchers = new Map()
const pendingReloads = new Map()
const suppressedUntil = new Map()
let reloadSeq = 0
const maintenanceNotified = new Map()
const sewaNotified = new Map()

const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'))

function getPluginFiles(dir) {
    let files = []
    if (!fs.existsSync(dir)) return files
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name)
        if (item.isDirectory()) files.push(...getPluginFiles(full))
        else if (item.isFile() && item.name.endsWith('.js')) files.push(full)
    }
    return files
}

function clearPending(target) {
    if (pendingReloads.has(target)) {
        clearTimeout(pendingReloads.get(target))
        pendingReloads.delete(target)
    }
}

function unregisterKeys(file) {
    const keys = pluginCache.get(file) || []
    for (const key of keys) {
        if (commandOwner.get(key) === file) {
            plugins.delete(key)
            commandOwner.delete(key)
        }
    }
    pluginCache.delete(file)
    return keys.filter(key => typeof key === 'string')
}

export async function loadPlugin(file) {
    try {
        const module = await import(`${pathToFileURL(file).href}?update=${Date.now()}-${++reloadSeq}`)
        const handler = module.default
        const extras = Array.isArray(module.handlers)
            ? module.handlers.filter(h => typeof h === 'function')
            : []

        if (!handler && !extras.length) {
            return { ok: true, registered: false, reason: 'no-default', commands: [] }
        }

        if (handler && typeof handler !== 'function') {
            return {
                ok: false,
                registered: false,
                error: new Error('export default harus berupa function handler')
            }
        }

        unregisterKeys(file)

        for (const fn of [handler, ...extras].filter(Boolean)) {
            try { fn.pluginFile = file } catch {}
        }

        const keys = []

        const register = (key, fn) => {
            const prev = commandOwner.get(key)

            if (prev && prev !== file && typeof key === 'string') {
                console.warn(
                    `[Plugin] Command "${key}" dipakai ganda: ` +
                    `${path.relative(__dirname, prev)} ditimpa oleh ` +
                    `${path.relative(__dirname, file)}`
                )
            }

            plugins.set(key, fn)
            commandOwner.set(key, file)
            keys.push(key)
        }

        for (const fn of [handler, ...extras].filter(Boolean)) {
            if (fn.command && !(fn.command instanceof RegExp)) {
                const commands = Array.isArray(fn.command)
                    ? fn.command
                    : [fn.command]

                for (const cmd of commands) {
                    register(String(cmd).toLowerCase(), fn)
                }
            }

            if (fn.customPrefix) {
                register(Symbol(file), fn)
            }
        }

        pluginCache.set(file, keys)

        return {
            ok: true,
            registered: keys.length > 0,
            commands: keys.filter(key => typeof key === 'string')
        }
    } catch (e) {
        console.error(`[Plugin Load Error] Gagal load ${file}:`, e)
        return {
            ok: false,
            registered: false,
            error: e
        }
    }
}

export function unloadPlugin(file) {
    clearPending(file)
    return unregisterKeys(file)
}

export async function reloadPlugin(file) {
    clearPending(file)
    suppressedUntil.set(file, Date.now() + 1500)
    return loadPlugin(file)
}

export async function reloadAllPlugins() {
    const result = {
        ok: 0,
        failed: [],
        commands: 0
    }

    for (const file of getPluginFiles(pluginDir)) {
        const res = await reloadPlugin(file)

        if (res.ok) {
            result.ok++
            result.commands += res.commands.length
        } else {
            result.failed.push(path.relative(__dirname, file))
        }
    }

    return result
}

export function findPluginFile(name) {
    const key = String(name || '').toLowerCase().replace(/\.js$/, '')
    if (!key) return null

    for (const [file, keys] of pluginCache) {
        if (
            path.basename(file, '.js').toLowerCase() === key ||
            keys.includes(key)
        ) {
            return file
        }
    }

    return null
}

export function listPluginFiles() {
    return [...pluginCache.entries()].map(([file, keys]) => ({
        file,
        rel: path.relative(__dirname, file),
        commands: keys.filter(k => typeof k === 'string')
    }))
}

export async function initPlugins() {
    for (const file of getPluginFiles(pluginDir)) {
        await loadPlugin(file)
    }

    watch(pluginDir)
}

function closeWatcher(dir) {
    const watcher = watchers.get(dir)
    if (!watcher) return

    try {
        watcher.close()
    } catch {}

    watchers.delete(dir)
}

async function handleFsChange(full) {
    let stat = null

    try {
        stat = fs.statSync(full)
    } catch {}

    if (!stat) {
        if (watchers.has(full)) {
            for (const dir of [...watchers.keys()]) {
                if (dir === full || dir.startsWith(full + path.sep)) {
                    closeWatcher(dir)
                }
            }

            for (const file of [...pluginCache.keys()]) {
                if (file.startsWith(full + path.sep)) {
                    unloadPlugin(file)
                }
            }
        } else if (full.endsWith('.js')) {
            unloadPlugin(full)
        }

        return
    }

    if (stat.isDirectory()) {
        watch(full)

        for (const file of getPluginFiles(full)) {
            if (!pluginCache.has(file)) {
                await loadPlugin(file)
            }
        }

        return
    }

    if (stat.isFile() && full.endsWith('.js')) {
        if ((suppressedUntil.get(full) || 0) > Date.now()) return

        suppressedUntil.delete(full)
        await loadPlugin(full)
    }
}

function watch(dir) {
    if (watchers.has(dir)) return

    let watcher

    try {
        watcher = fs.watch(dir, (_, filename) => {
            if (!filename) return

            const full = path.join(dir, filename.toString())

            clearPending(full)

            pendingReloads.set(
                full,
                setTimeout(() => {
                    pendingReloads.delete(full)

                    handleFsChange(full).catch(
                        e => console.error('[Plugin Watch Error]', e)
                    )
                }, 200)
            )
        })
    } catch (e) {
        console.error(
            `[Plugin Watch Error] Gagal memantau ${dir}:`,
            e.message
        )
        return
    }

    watcher.on('error', e => {
        console.error(
            `[Plugin Watch Error] ${dir}:`,
            e.message
        )

        closeWatcher(dir)
    })

    watchers.set(dir, watcher)

    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.isDirectory()) {
            watch(path.join(dir, item.name))
        }
    }
}

function extractCommandFromMessage(m) {
    let body = ''
    let isButtonResponse = false

    try {
        if (m.message) {
            if (m.message.conversation) {
                body = m.message.conversation
            } else if (m.message.extendedTextMessage?.text) {
                body = m.message.extendedTextMessage.text
            } else if (m.message.imageMessage?.caption) {
                body = m.message.imageMessage.caption
            } else if (m.message.videoMessage?.caption) {
                body = m.message.videoMessage.caption
            } else if (m.message.documentMessage?.caption) {
                body = m.message.documentMessage.caption
            } else if (m.message.interactiveResponseMessage) {
                const inter = m.message.interactiveResponseMessage

                if (inter.nativeFlowResponseMessage) {
                    const flow = inter.nativeFlowResponseMessage

                    if (flow.paramsJson) {
                        try {
                            const params = JSON.parse(flow.paramsJson)

                            body = String(
                                params.id ||
                                params.buttonId ||
                                params.rowId ||
                                params.index ||
                                ''
                            )
                        } catch {
                            body = flow.name || ''
                        }
                    } else {
                        body = flow.name || ''
                    }

                    isButtonResponse = true
                } else if (inter.buttonReply) {
                    body = inter.buttonReply.selectedButtonId || ''
                    isButtonResponse = true
                } else if (inter.singleSelectReply) {
                    body = inter.singleSelectReply.selectedRowId || ''
                    isButtonResponse = true
                }
            } else if (m.message.templateButtonReplyMessage) {
                body = m.message.templateButtonReplyMessage.selectedId || ''
                isButtonResponse = true
            } else if (m.message.buttonsResponseMessage) {
                body = m.message.buttonsResponseMessage.selectedButtonId || ''
                isButtonResponse = true
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error)
    }

    return {
        body,
        isButtonResponse
    }
}

const handledIds = new Map()
const HANDLED_TTL = 2 * 60 * 1000

function alreadyHandled(m) {
    const id = m?.id || m?.key?.id
    if (!id) return false

    const now = Date.now()

    if (now - (handledIds.get(id) || 0) < HANDLED_TTL) {
        return true
    }

    handledIds.set(id, now)

    if (handledIds.size > 2000) {
        for (const [k, t] of handledIds) {
            if (now - t > HANDLED_TTL) {
                handledIds.delete(k)
            }
        }
    }

    return false
}

export default async function handleMessage(conn, m) {
    try {
        if (alreadyHandled(m)) {
            console.warn(
                '[Handler] pesan yang sama terpanggil dua kali, diabaikan:',
                m?.id
            )
            return
        }

        await autoReadMessage(conn, m)

        if (
            m.isGroup &&
            !m.fromMe &&
            await runGuard(conn, m)
        ) {
            return
        }

        const {
            body,
            isButtonResponse
        } = extractCommandFromMessage(m)

        const owner = readJSON(ownerPath)
        const premium = readJSON(premiumPath)

        const number = m.sender.split('@')[0]
        const botNumber = conn.decodeJid(conn.user.id).split('@')[0]

        const creatorList = [
            botNumber,
            ...(config.creator || [])
        ].map(v => String(v).replace(/[^0-9]/g, ''))

        m.isCreator =
            creatorList.includes(number) ||
            !!m.fromMe ||
            [
                conn?.user?.id,
                conn?.user?.lid
            ]
                .filter(Boolean)
                .some(b => isSameJid(b, m.sender))

        m.isOwner =
            m.isCreator ||
            owner.map(v => v.split('@')[0]).includes(number)

        m.isPremium =
            m.isOwner ||
            premium.map(v => v.split('@')[0]).includes(number)

        // [MUTE] Hapus pesan anggota yang di-mute sebelum command diproses.
        if (await deleteMutedMessage(conn, m)) return

        // Autoblock aktif: blokir semua DM masuk kecuali creator/owner yang di-whitelist.
        // Grup tidak terpengaruh; pesan dihentikan sebelum command diproses.
        if (await runAutoblock(conn, m, config)) return

        if (!body) return

        m.text = body
        m.isButtonResponse = isButtonResponse

        if (!m.fromMe) {
            logger.chat(
                m,
                body,
                config.ownerName
            )
        }

        if (
            config.botMode === 'self' &&
            !m.isOwner &&
            !m.fromMe
        ) {
            return
        }

        const notifReply = makeInappReply(conn, m)
        const notifFor = () => notifReply

        const checkAccess = handler => {
            if (
                config.maintenance?.on &&
                !m.isOwner
            ) {
                const last =
                    maintenanceNotified.get(m.chat) || 0

                if (Date.now() - last > 60000) {
                    maintenanceNotified.set(
                        m.chat,
                        Date.now()
                    )

                    notifReply(
                        config.maintenance.text,
                        'Maintenance'
                    ).catch(() => {})
                }

                return true
            }

            const permissions = [
                [
                    'owner',
                    m.isOwner,
                    config.accessDenied.owner
                ],
                [
                    'creator',
                    m.isCreator,
                    config.accessDenied.creator
                ],
                [
                    'premium',
                    m.isPremium,
                    config.accessDenied.premium
                ]
            ]

            // Command bertanda sewaFree (.sewa, .ceksewa, .sewamenu) tetap bisa dipakai di grup tanpa sewa.
            if (
                m.isGroup &&
                !m.isOwner &&
                !handler.sewaFree &&
                isSewaBlocked(m.chat)
            ) {
                // Jangan spam: satu pemberitahuan per grup tiap 30 detik.
                const last = sewaNotified.get(m.chat) || 0

                if (Date.now() - last > 30000) {
                    sewaNotified.set(m.chat, Date.now())

                    notifReply(
                        'Masa sewa bot di grup ini belum aktif / sudah habis.\nLihat paket: .sewa  |  Cek status: .ceksewa\nHubungi owner untuk sewa.',
                        'Sewa'
                    ).catch(() => {})
                }

                return true
            }

            for (const [
                key,
                allowed,
                message
            ] of permissions) {
                if (handler[key] && !allowed) {
                    notifReply(
                        message,
                        'Access Denied'
                    ).catch(
                        e => console.error(
                            '[Handler] notifReply gagal:',
                            e?.message || e
                        )
                    )

                    return true
                }
            }

            return false
        }

        if (isButtonResponse) {
            let bodyText = body
            const prefixes = config.prefix || ['.']

            for (const p of prefixes) {
                if (bodyText.startsWith(p)) {
                    bodyText = bodyText.slice(p.length)
                    break
                }
            }

            const args = bodyText.trim().split(/\s+/)
            const command = args.shift().toLowerCase()
            const handler = plugins.get(command)

            if (!handler) {
                await runAutoblock(conn, m, config)
                return
            }
            if (checkAccess(handler)) return

            trackCommand(
                m.sender,
                command,
                m.pushName
            )

            logger.command(
                m,
                `${command} (tombol)`,
                args
            )

            return await runHandler(handler, m, {
                conn,
                args,
                text: args.join(' '),
                command,
                prefix: '',
                notifReply: notifFor(handler)
            })
        }

        const hasConfigPrefix =
            (config.prefix || ['.'])
                .some(p => m.text.startsWith(p))

        if (
            !hasConfigPrefix &&
            hasSession(m.chat) &&
            await checkAnswer(conn, m)
        ) {
            return
        }

        if (
            !hasConfigPrefix &&
            !m.fromMe &&
            sessionOn(m) &&
            m.text.length <= 2000 &&
            !plugins.has(
                m.text.trim().toLowerCase()
            ) &&
            !(config.maintenance?.on && !m.isOwner) &&
            !(m.isGroup &&
              !m.isOwner &&
              isSewaBlocked(m.chat))
        ) {
            const askHandler = plugins.get('chat')

            if (askHandler) {
                logger.ai(
                    'MODE NGOBROL',
                    `${m.pushName || m.sender.split('@')[0]}: ${m.text}`
                )
            }

            if (askHandler) {
                return await askHandler(m, {
                    conn,
                    args: m.text.trim().split(/\s+/),
                    text: m.text,
                    command: 'chat',
                    prefix: '',
                    notifReply: notifFor(askHandler)
                })
            }
        }

        if (!hasConfigPrefix) {
            let matchedHandler = null

            for (const handler of plugins.values()) {
                if (!handler.customPrefix) continue
                if (!handler.customPrefix.source.startsWith('^')) continue
                if (!handler.customPrefix.test(m.text)) continue

                matchedHandler = handler
                break
            }

            if (!matchedHandler) {
                for (const handler of plugins.values()) {
                    if (!handler.customPrefix) continue
                    if (handler.customPrefix.source.startsWith('^')) continue
                    if (!handler.customPrefix.test(m.text)) continue

                    matchedHandler = handler
                    break
                }
            }

            if (matchedHandler) {
                if (checkAccess(matchedHandler)) return

                logger.command(
                    m,
                    'customPrefix',
                    [m.text]
                )

                return await runHandler(matchedHandler, m, {
                    conn,
                    args: [],
                    text: m.text,
                    command: '',
                    prefix: '',
                    notifReply: notifFor(matchedHandler)
                })
            }
        }

        let prefix = ''
        let command = ''
        let args = []

        if (hasConfigPrefix) {
            prefix = (config.prefix || ['.'])
                .find(p => m.text.startsWith(p))

            const body2 =
                m.text.slice(prefix.length).trim()

            if (!body2) return

            const parts = body2.split(/\s+/)

            command = parts.shift().toLowerCase()
            args = parts
        } else {
            const trimmed = m.text.trim()

            if (/\s/.test(trimmed)) {
                await runAutoblock(conn, m, config)
                return
            }

            command = trimmed.toLowerCase()
            args = []
        }

        const handler = plugins.get(command)

        if (!handler) {
            await runAutoblock(conn, m, config)
            return
        }
        if (!hasConfigPrefix && handler.requirePrefix) return
        if (checkAccess(handler)) return

        trackCommand(
            m.sender,
            command,
            m.pushName
        )

        logger.command(
            m,
            `${prefix}${command}`,
            args
        )

        await runHandler(handler, m, {
            conn,
            args,
            text: m.text.slice(prefix.length).replace(/^\S+\s?/, ''),
            command,
            prefix,
            notifReply: notifFor(handler)
        })
    } catch (e) {
        console.error('[Handler Error]', e)
    }
}