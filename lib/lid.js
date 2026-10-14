/*
  Kompatibilitas LID (Baileys 7).
  File ini sebelumnya TIDAK ADA di zip padahal di-import index.js -> bot crash saat start.
  Implementasi minimal & aman: kalau gagal resolve, pesan dibiarkan apa adanya.
*/
const isLid = jid => typeof jid === 'string' && jid.endsWith('@lid')

async function lidToPn(sock, lid) {
    if (!isLid(lid)) return lid
    try {
        const repo = sock?.signalRepository?.lidMapping
        const pn = await repo?.getPNForLID?.(lid)
        if (pn) return pn.includes('@') ? pn : `${pn}@s.whatsapp.net`
    } catch {}
    return lid
}

export function installLidSupport(sock) {
    sock.lidToPn = jid => lidToPn(sock, jid)
    return sock
}

export async function resolveMessageLids(sock, m) {
    try {
        const alt = m.key?.participantAlt || m.key?.remoteJidAlt
        if (m.sender && isLid(m.sender)) {
            m.sender = alt && !isLid(alt) ? alt : await lidToPn(sock, m.sender)
        }
        if (Array.isArray(m.mentionedJid)) {
            m.mentionedJid = await Promise.all(m.mentionedJid.map(j => lidToPn(sock, j)))
        }
    } catch {}
    return m
}
