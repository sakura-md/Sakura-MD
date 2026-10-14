/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import config from '../../config.js'
import { getStore } from '../../lib/cache.js'
import { checkCooldown } from '../../lib/cooldown.js'
import { link } from '../../lib/scrape/alightmotion.js'

const TITLE = 'Alight Motion'
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/

const emails = getStore('am-email', 30 * 60 * 1000, 500)

let handler = async (m, { args, prefix, notifReply }) => {
  const pfx = prefix || config.prefix?.[0] || '.'
  const email = (args[0] || '').trim().toLowerCase()

  if (!email) return notifReply(`Contoh:\n${pfx}amsend user@gmail.com`, TITLE)
  if (email.length > 254 || !EMAIL.test(email)) return notifReply('Format email tidak valid.', TITLE)

  if (!m.isOwner) {
    const cd = checkCooldown(`am:${m.sender}`, config.limits?.cooldown?.alightMotion ?? 20)
    if (!cd.ok) return notifReply(`Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi.`, TITLE)
  }

  await notifReply(`📧 Mengirim permintaan ke ${email}...`, TITLE)

  const r = await link(email)
  if (!r.ok) return notifReply(`❌ Gagal mengirim link: ${r.why}`, TITLE)

  emails.set(m.sender, email)

  await notifReply(
    `✅ Permintaan terkirim ke ${email}.\n\n📬 Cek inbox / folder spam untuk link verifikasi.\n\nSetelah menerima link, jalankan:\n${pfx}amverify <link> [orderId]\n\n💡 orderId opsional (custom), default random.`,
    TITLE
  )
}

handler.command = ['amsend']
handler.desc = 'Alight Motion: kirim email verifikasi'
handler.tags = ['apk']
handler.premium = true

export default handler