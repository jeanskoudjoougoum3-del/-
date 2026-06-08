const warnings = new Map();
const MAX_WARNINGS = 3;

export function getWarnings(groupId, userId) {
  return warnings.get(`${groupId}:${userId}`) || 0;
}

export async function warnUser(sock, groupId, userId, reason = "violation des règles") {
  const key = `${groupId}:${userId}`;
  const count = (warnings.get(key) || 0) + 1;
  warnings.set(key, count);

  if (count >= MAX_WARNINGS) {
    warnings.delete(key);
    try {
      await sock.groupParticipantsUpdate(groupId, [userId], "remove");
      return {
        reply: `🚨 @${userId.split("@")[0]} a reçu *${MAX_WARNINGS} avertissements* et a été *banni automatiquement* ! 🔨`,
        mentions: [userId],
        banned: true,
      };
    } catch (e) {
      console.error("Warn ban error:", e);
    }
  }

  return {
    reply: `⚠️ *Avertissement ${count}/${MAX_WARNINGS}* pour @${userId.split("@")[0]}\n📌 Raison : *${reason}*\n\n${count === MAX_WARNINGS - 1 ? "🔴 Prochain avertissement = *BAN automatique !*" : ""}`,
    mentions: [userId],
    banned: false,
  };
}

export function resetWarnings(groupId, userId) {
  warnings.delete(`${groupId}:${userId}`);
}