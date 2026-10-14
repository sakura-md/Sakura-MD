/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { isGroupAdminJid, isBotGroupAdmin } from './myfunc.js'
import { getMeta } from './guard.js'
import { box } from './format.js'
import logger from './logger.js'

// Pembungkus command Sakura-MD:
//  - validasi konteks (group / admin / botAdmin) dengan pesan yang jelas
//  - error handling seragam (tidak pernah membocorkan stack trace / key / token)
//  - metadata command (command, desc, tags, owner, creator, premium, group, download) tetap di function
//    sehingga menu kategori otomatis mengenalinya.
export function cmd(spec, run) {
    const { title = 'Sakura-MD', admin = false, botAdmin = false, ...meta } = spec
    const handler = async (m, ctx) => {
        try {
            if (meta.group || admin || botAdmin) {
                if (!m.isGroup) return ctx.notifReply('Command ini hanya bisa dipakai di dalam grup', title)
                const groupMeta = await getMeta(ctx.conn, m.chat, admin || botAdmin)
                if (!groupMeta) return ctx.notifReply('Gagal mengambil data grup, coba lagi', title)
                if (admin && !m.isOwner && !isGroupAdminJid(groupMeta.participants, m.sender)) {
                    return ctx.notifReply('Fitur ini khusus Admin Grup', title)
                }
                if (botAdmin && !isBotGroupAdmin(groupMeta, ctx.conn)) {
                    return ctx.notifReply('Bot harus jadi Admin Grup dulu untuk memakai fitur ini', title)
                }
                ctx.meta = groupMeta
            }
            const t0 = Date.now()
            const result = await run(m, ctx)
            logger.ok(`${title} selesai (${Date.now() - t0} ms)`)
            return result
        } catch (e) {
            console.error(`[${title}] error:`, e)
            const detail = String(e?.message || 'Kesalahan tidak diketahui').split('\n')[0].slice(0, 200)
            await ctx.notifReply(box('❌ GAGAL', ['Terjadi kesalahan saat memproses request', '', `Detail: ${detail}`]), title).catch(() => {})
        }
    }
    Object.assign(handler, { requirePrefix: true }, meta)
    return handler
}

// Kirim reaction (⏳ → ✅/❌). Gagal kirim reaction tidak boleh menggagalkan command.
export const react = (conn, m, emoji) => conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {})