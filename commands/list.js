const messageCount = new Map();

export function trackMessage(groupId, userId) {
  const key = `${groupId}:${userId}`;
  messageCount.set(key, (messageCount.get(key) || 0) + 1);
}

export function listCommand(groupId, participants) {
  const stats = participants
    .map((id) => ({
      id,
      count: messageCount.get(`${groupId}:${id}`) || 0,
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (stats.length === 0) return "📊 Aucun message enregistré pour l'instant.";

  let msg = "📊 *Top membres actifs :*\n\n";
  stats.forEach((m, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    msg += `${medal} @${m.id.split("@")[0]} — *${m.count} messages*\n`;
  });
  return msg;
}