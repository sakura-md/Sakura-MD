let handler = async (m, { conn }) => {
  try {
    const groupJid = m.chat;

    if (!groupJid.endsWith("@g.us")) {
      return m.reply("Command ini hanya untuk grup.");
    }

    await conn.groupParticipantsUpdate(
      groupJid,
      ["867051314767696@bot"],
      "add"
    );

    m.reply("Sukses add Meta AI ke grup ✅");
  } catch (e) {
    console.error(e);
    m.reply(String(e?.stack || e));
  }
};

handler.command = ["addai"];
handler.owner = true;
handler.group = true;
handler.desc = "Tambahkan Meta AI ke grup";

export default handler;
