import {
    getMuteTarget,
    getJidAliases,
    normalizeJid,
    readMuteDB,
    saveMuteDB
} from '../../lib/mute.js';

export default async function mute(m, { conn }) {
    if (!m.isGroup) {
        return m.reply('⚠️ Perintah ini hanya bisa digunakan di grup.');
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

    const existing = new Set(db[m.chat].map(normalizeJid));

    if (aliases.some(jid => existing.has(normalizeJid(jid)))) {
        return m.reply('ℹ️ Anggota tersebut sudah di-mute');
    }

    // Simpan JID utama dan alias LID/PN jika tersedia.
    db[m.chat].push(...aliases);

    db[m.chat] = [...new Set(db[m.chat].map(normalizeJid))];

    saveMuteDB(db);

    const mention = aliases[0] || target;

    await conn.sendMessage(
        m.chat,
        {
            text: `*🔇 Berhasil mute* @${mention.split('@')[0]}`,
            mentions: [target]
        },
        { quoted: m }
    );
}

mute.command = ['mute'];
mute.desc = 'Mute anggota grup dan hapus pesannya otomatis';
mute.tags = ['group'];
mute.group = true;