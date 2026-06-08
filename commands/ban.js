export async function banCommand(sock, msg, groupId, sender) {
  const meta = await sock.groupMetadata(groupId);
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const botP = meta.participants.find((p) => p.id === botId);
  const senderP = meta.participants.find((p) => p.id === sender);

  if (!botP?.admin) return { reply: "❌ Je dois être admin pour bannir.", mentions: [] };
  if (!senderP?.admin) return { reply: "⛔ Seuls les admins peuvent utiliser !ban.", mentions: [] };

  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  const target = quoted?.mentionedJid?.[0] || quoted?.participant;

  if (!target) return {
    reply: "❌ *Usage :* Cite un message ou mentionne avec *!ban @membre*",
    mentions: [],
  };

  const targetP = meta.participants.find((p) => p.id === target);
  if (targetP?.admin) return {
    reply: `⛔ Impossible de bannir @${target.split("@")[0]}, c'est un admin !`,
    mentions: [target],
  };

  try {
    await sock.groupParticipantsUpdate(groupId, [target], "remove");
    return {
      reply: `✅ @${target.split("@")[0]} a été banni du groupe. 🔨`,
      mentions: [target],
    };
  } catch (e) {
    return { reply: "❌ Erreur lors du ban.", mentions: [] };
  }
}