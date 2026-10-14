import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mutePath = path.join(__dirname, '../database/mute.json');

export function normalizeJid(jid) {
    return String(jid || '').replace(/:\d+@/, '@');
}

export async function getJidAliases(conn, jid) {
    const aliases = new Set();

    const add = value => {
        if (typeof value === 'string' && value.includes('@')) {
            aliases.add(normalizeJid(value));
        }
    };

    add(jid);

    try {
        const mapping = conn?.signalRepository?.lidMapping;

        if (mapping && jid?.endsWith('@lid')) {
            add(await mapping.getPNForLID(jid));
        }

        if (mapping && jid?.endsWith('@s.whatsapp.net')) {
            add(await mapping.getLIDForPN(jid));
        }
    } catch (error) {
        // Tetap gunakan JID asli jika pemetaan tidak tersedia.
    }

    return [...aliases];
}

export function getMuteTarget(m) {
    const contexts = [
        m?.msg?.contextInfo,
        m?.message?.extendedTextMessage?.contextInfo,
        m?.message?.imageMessage?.contextInfo,
        m?.message?.videoMessage?.contextInfo,
        m?.message?.documentMessage?.contextInfo
    ].filter(Boolean);

    const mentions = [
        ...(Array.isArray(m?.mentionedJid) ? m.mentionedJid : []),
        ...contexts.flatMap(ctx =>
            Array.isArray(ctx.mentionedJid) ? ctx.mentionedJid : []
        )
    ].filter(Boolean);

    const target = mentions[0];

    if (target) return target;

    // Jika tidak ada mention, ambil peserta dari pesan yang dibalas.
    for (const ctx of contexts) {
        const participant = ctx.participantAlt || ctx.participant;
        if (participant) return participant;
    }

    return null;
}

export function readMuteDB() {
    try {
        if (!fs.existsSync(mutePath)) {
            fs.mkdirSync(path.dirname(mutePath), { recursive: true });
            fs.writeFileSync(mutePath, '{}');
        }

        const data = JSON.parse(fs.readFileSync(mutePath, 'utf8'));

        return data && typeof data === 'object' && !Array.isArray(data)
            ? data
            : {};
    } catch (error) {
        console.error('[Mute] Gagal membaca database:', error);
        return {};
    }
}

export function saveMuteDB(data) {
    fs.mkdirSync(path.dirname(mutePath), { recursive: true });

    fs.writeFileSync(
        mutePath,
        JSON.stringify(data, null, 2),
        'utf8'
    );
}