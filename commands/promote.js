async function checkAdmin(sock, groupId, sender) {
  const meta = await sock.groupMetadata(groupId);
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const bot = meta.participants.find((p) => p.id === botId);
  const senderP = meta.participants.find((p) => p.id === sender);
  return {
    botIsAdmin: !!bot?.admin,
    senderIsAdmin: !!senderP?.admin,
    participants: meta.participants,
  };
}

function getTarget(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo;
  return quoted?.mentionedJid?.[0] || quoted?.participant || null;
}

export async function promoteCommand(sock, msg, groupId, sender) {
  const { botIsAdmin, senderIsAdmin } = await checkAdmin(sock, groupId, sender);
  if (!botIsAdmin) return { reply: "❌ Je dois être admin pour promouvoir.", mentions: [] };
  if (!senderIsAdmin) return { reply: "⛔ Seuls les admins peuvent utiliser !promote.", mentions: [] };

  const target = getTarget(msg);
  if (!target) return {
    reply: "❌ Cite un message ou mentionne avec *!promote @membre*",
    mentions: [],
  };

  try {
    await sock.groupParticipantsUpdate(groupId, [target], "promote");
    return {
      reply: `✅ @${target.split("@")[0]} est maintenant *Admin* ! 🛡️`,
      mentions: [target],
    };
  } catch (e) {
    return { reply: "❌ Erreur lors de la promotion.", mentions: [] };
  }
}

export async function demoteCommand(sock, msg, groupId, sender) {
  const { botIsAdmin, senderIsAdmin, participants } = await checkAdmin(sock, groupId, sender);
  if (!botIsAdmin) return { reply: "❌ Je dois être admin pour rétrograder.", mentions: [] };
  if (!senderIsAdmin) return { reply: "⛔ Seuls les admins peuvent utiliser !demote.", mentions: [] };

  const target = getTarget(msg);
  if (!target) return {
    reply: "❌ Cite un message ou mentionne avec *!demote @membre*",
    mentions: [],
  };

  const targetP = participants.find((p) => p.id === target);
  if (targetP?.admin === "superadmin") return {
    reply: "⛔ Impossible de rétrograder le créateur du groupe !",
    mentions: [],
  };

  try {
    await sock.groupParticipantsUpdate(groupId, [target], "demote");
    return {
      reply: `✅ @${target.split("@")[0]} a été *retiré des admins*. 📉`,
      mentions: [target],
    };
  } catch (e) {
    return { reply: "❌ Erreur lors de la rétrogradation.", mentions: [] };
  }
}