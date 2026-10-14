import {
    getMuteTarget,
    getJidAliases,
    normalizeJid,
    readMuteDB,
    saveMuteDB
} from '../../lib/mute.js';

export default async function unmute(m, { conn }) {
    if (!m.isGroup) {
        return m.reply('⚠️ Perintah ini hanya bisa digunakan di grup');
    }

    const target = getMuteTarget(m);

    if (!target) {
        return m.reply(
            '⚠️ Tag anggota atau balas pesannya'
        );
    }

    const aliases = await getJidAliases(conn, target);
    const db = readMuteDB();

    if (!Array.isArray(db[m.chat])) {
        db[m.chat] = [];
    }

    const targetAliases = new Set(aliases.map(normalizeJid));

    const isMuted = db[m.chat].some(jid =>
        targetAliases.has(normalizeJid(jid))
    );

    if (!isMuted) {
        return m.reply('ℹ️ Anggota tersebut tidak sedang di-mute');
    }

    db[m.chat] = db[m.chat].filter(jid =>
        !targetAliases.has(normalizeJid(jid))
    );

    saveMuteDB(db);

    await conn.sendMessage(
        m.chat,
        {
            text: `*🔊 Berhasil unmute* @${target.split('@')[0]}*`,
            mentions: [target]
        },
        { quoted: m }
    );
}

unmute.command = ['unmute'];
unmute.desc = 'Membatalkan mute anggota grup';
unmute.tags = ['group'];
unmute.group = true;