const adminMessageCount = new Map();

export function trackAdminMessage(groupId, userId, isAdmin) {
  if (!isAdmin) return;
  const key = `${groupId}:${userId}`;
  adminMessageCount.set(key, (adminMessageCount.get(key) || 0) + 1);
}

export function listAdminsCommand(groupId, participants) {
  const admins = participants.filter(
    (p) => p.admin === "admin" || p.admin === "superadmin"
  );

  if (admins.length === 0) return "❌ Aucun admin trouvé.";

  const stats = admins
    .map((p) => ({
      id: p.id,
      role: p.admin,
      count: adminMessageCount.get(`${groupId}:${p.id}`) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  let msg = "👑 *Top Admins Actifs :*\n\n";
  stats.forEach((a, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const crown = a.role === "superadmin" ? "👑" : "🛡️";
    msg += `${medal} ${crown} @${a.id.split("@")[0]} — *${a.count} messages*\n`;
  });

  return msg;
}