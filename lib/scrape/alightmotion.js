/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const cfg = {
  key: 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0',
  idt: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
  stk: 'https://securetoken.googleapis.com/v1/token',
  vfy: 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
}

/* ================= DATABASE (JSON) ================= */
const DB_DIR = path.join(process.cwd(), 'database')
const F_COUNTER = path.join(DB_DIR, 'counter.json')
const F_GMAIL   = path.join(DB_DIR, 'gmail.json')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const ensure = (file, def) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(def, null, 2))
}

ensure(F_COUNTER, { counters: {} })
ensure(F_GMAIL,   { gmail: [] })

const read = (file, def) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return def }
}

const write = (file, data) => {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return true }
  catch { return false }
}

/* ================= COUNTER ================= */
const getCounter = (prefix) => {
  const db = read(F_COUNTER, { counters: {} })
  return db.counters[prefix]?.count || 0
}

const incCounter = (prefix) => {
  const db = read(F_COUNTER, { counters: {} })
  const next = (db.counters[prefix]?.count || 0) + 1
  db.counters[prefix] = { count: next, updated_at: new Date().toISOString() }
  write(F_COUNTER, db)
  return next
}

const setCounter = (prefix, n) => {
  const db = read(F_COUNTER, { counters: {} })
  db.counters[prefix] = { count: Number(n) || 0, updated_at: new Date().toISOString() }
  write(F_COUNTER, db)
  return Number(n) || 0
}

const nextOrderId = (prefix = 'SAKURA-PREM') => {
  const n = incCounter(prefix)
  return `${prefix}-${String(n).padStart(4, '0')}`
}

/* ================= GMAIL ================= */
const saveGmail = (data) => {
  const db = read(F_GMAIL, { gmail: [] })
  const i = db.gmail.findIndex(g => g.email === data.email)
  const rec = { ...data, updated_at: new Date().toISOString() }
  if (i >= 0) db.gmail[i] = { ...db.gmail[i], ...rec }
  else db.gmail.push({ id: db.gmail.length + 1, ...rec, created_at: rec.updated_at })
  write(F_GMAIL, db)
  return rec
}

const getGmail = (email) => {
  const db = read(F_GMAIL, { gmail: [] })
  return db.gmail.find(g => g.email === email) || null
}

const allGmail = () => read(F_GMAIL, { gmail: [] }).gmail

/* ================= HELPERS ================= */
const dip = () => [crypto.randomInt(1, 255), crypto.randomInt(0, 255), crypto.randomInt(0, 255), crypto.randomInt(1, 255)].join('.')

const sp = h => ({
  ...h,
  'x-forwarded-for': dip(),
  'x-real-ip': dip(),
  'client-ip': dip(),
  'x-client-ip': dip(),
  'x-originating-ip': dip(),
  'x-cluster-client-ip': dip()
})

const h1 = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
}

const h2 = {
  'content-type': 'application/json; charset=utf-8',
  'user-agent': 'okhttp/3.12.1',
  'accept-encoding': 'gzip'
}

const bad = e => {
  const d = e.response?.data
  return d ? (typeof d === 'object' ? JSON.stringify(d) : String(d)) : e.message
}

/* ================= MAIN ================= */
export async function link(email) {
  const c1 = { identifier: email, continueUri: 'http://localhost' }
  const c2 = {
    requestType: 6,
    email,
    androidInstallApp: true,
    canHandleCodeInApp: true,
    continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
    iosBundleId: 'com.alightcreative.motion',
    androidPackageName: 'com.alightcreative.motion',
    androidMinimumVersion: '585',
    clientType: 'CLIENT_TYPE_ANDROID'
  }
  try {
    await axios.post(`${cfg.idt}/createAuthUri?key=${cfg.key}`, c1, { headers: sp(h1) })
    const r = await axios.post(`${cfg.idt}/getOobConfirmationCode?key=${cfg.key}`, c2, { headers: sp(h1) })
    return { ok: true, r: r.data }
  } catch (e) {
    return { ok: false, why: bad(e) }
  }
}

export function code(raw) {
  if (!raw) return null
  let s = String(raw).replace(/&/g, '&')
  try { s = decodeURIComponent(s) } catch {}
  try {
    const u = new URL(s)
    let c = u.searchParams.get('oobCode')
    if (!c) {
      const n = u.searchParams.get('link') || u.searchParams.get('q') || u.searchParams.get('url')
      if (n) { try { c = new URL(n).searchParams.get('oobCode') } catch {} }
    }
    if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '')
  } catch {}
  const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i)
  if (m) return m[1]
  const t = raw.trim()
  if (/^[a-zA-Z0-9_-]{10,}$/.test(t) && !t.includes('://')) return t
  return null
}

export async function auth(email, raw) {
  const c = code(raw)
  if (!c) return { ok: false, why: 'Code tidak ditemukan' }
  try {
    const a = await axios.post(`${cfg.idt}/emailLinkSignin?key=${cfg.key}`, {
      email, oobCode: c, clientType: 'CLIENT_TYPE_ANDROID'
    }, { headers: sp(h1) })
    let u = null
    try {
      const b = await axios.post(`${cfg.idt}/getAccountInfo?key=${cfg.key}`, {
        idToken: a.data.idToken
      }, { headers: sp(h1) })
      u = b.data?.users?.[0] || null
    } catch {}
    const result = {
      ok: true,
      email,
      id: a.data.idToken,
      ref: a.data.refreshToken,
      uid: a.data.localId,
      baru: !!a.data.isNewUser,
      user: u
    }
    saveGmail({
      email,
      uid: result.uid,
      isNew: result.baru,
      last_login: new Date().toISOString()
    })
    return result
  } catch (e) {
    return { ok: false, why: bad(e) }
  }
}

export async function pro(id, customId, prefix = 'SAKURA-PREM', meta = {}) {
  const o = customId ? customId : nextOrderId(prefix)
  const b = {
    data: {
      productId: 'am.full.sub.annual.19q4',
      token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
      skuType: 'subs',
      orderId: o
    }
  }
  const h = {
    ...h2,
    authorization: 'Bearer ' + id,
    'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'
  }
  try {
    const r = await axios.post(cfg.vfy, b, { headers: sp(h) })
    if (meta.email) {
      saveGmail({
        email: meta.email,
        uid: meta.uid,
        order: o,
        prefix,
        status: 'success',
        last_order: new Date().toISOString()
      })
    }
    return { ok: true, order: o, r: r.data }
  } catch (e) {
    if (meta.email) {
      saveGmail({
        email: meta.email,
        uid: meta.uid,
        order: o,
        prefix,
        status: 'failed',
        reason: bad(e),
        last_order: new Date().toISOString()
      })
    }
    return { ok: false, why: bad(e) }
  }
}

export async function re(ref) {
  try {
    const r = await axios.post(`${cfg.stk}?key=${cfg.key}`, {
      grant_type: 'refresh_token',
      refresh_token: ref
    })
    return { ok: true, id: r.data.id_token, ref: r.data.refresh_token }
  } catch (e) {
    return { ok: false, why: bad(e) }
  }
}

/* ================= ADMIN / UTILS ================= */
export function counter(prefix = 'SAKURA-PREM') {
  const n = getCounter(prefix)
  return {
    prefix,
    count: n,
    next: `${prefix}-${String(n + 1).padStart(4, '0')}`,
    last: n > 0 ? `${prefix}-${String(n).padStart(4, '0')}` : null
  }
}

export function allCounters() {
  return read(F_COUNTER, { counters: {} }).counters
}

export function resetCounter(prefix = 'SAKURA-PREM') {
  setCounter(prefix, 0)
  return { ok: true, prefix, count: 0 }
}

export function gmail(email) {
  return email ? getGmail(email) : allGmail()
}

export default {
  link, code, auth, pro, re,
  counter, allCounters, resetCounter,
  gmail
}