/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { getStore } from '../../lib/cache.js'
import { checkCooldown } from '../../lib/cooldown.js'
import { auth, pro } from '../../lib/scrape/alightmotion.js'

const TITLE = 'Alight Motion'

const emails = getStore('am-email', 30 * 60 * 1000, 500)

let handler = async (m, { args, prefix, notifReply }) => {
  const pfx = prefix || config.prefix?.[0] || '.'
  const raw = (args[0] || '').trim()
  const customId = (args[1] || '').trim() || null

  if (!raw) return notifReply(`Contoh:\n${pfx}amverify <link_verifikasi> [orderId]`, TITLE)

  const email = emails.get(m.sender)
  if (!email) return notifReply(`Email belum diset. Jalankan dulu:\n${pfx}amsend user@gmail.com`, TITLE)

  if (!m.isOwner) {
    const cd = checkCooldown(`am:${m.sender}`, config.limits?.cooldown?.alightMotion ?? 20)
    if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
  }

  await notifReply(`🔐 Memverifikasi link untuk ${email}...`, TITLE)

  const v = await auth(email, raw)
  if (!v.ok) return notifReply(`❌ Gagal verifikasi: ${v.why}`, TITLE)

  await notifReply(
    `✅ Login berhasil!\n📧 Email: ${v.email}\n🆕 Akun baru: ${v.baru ? 'Ya' : 'Tidak'}\n\n⏳ Mempromosikan akun...`,
    TITLE
  )

  const q = await pro(v.id, customId)
  if (!q.ok) return notifReply(`❌ Gagal mempromosikan: ${q.why}`, TITLE)

  emails.set(m.sender, v.email)

  await notifReply(
    `🎉 *PREMIUM SUCCESS!*\n📧 Email: ${v.email}\n🆔 Order: ${q.order}\n📅 Status: Active\n\nAkun Alight Motion telah dipremium!`,
    TITLE
  )
}

handler.command = ['amverify']
handler.desc = 'Alight Motion: verifikasi link & premium'
handler.tags = ['apk']
handler.premium = true

export default handler