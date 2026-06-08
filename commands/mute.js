async function checkAdmin(sock, groupId, sender) {
  const meta = await sock.groupMetadata(groupId);
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const bot = meta.participants.find((p) => p.id === botId);
  const senderP = meta.participants.find((p) => p.id === sender);
  return { botIsAdmin: !!bot?.admin, senderIsAdmin: !!senderP?.admin };
}

export async function muteCommand(sock, groupId, sender) {
  const { botIsAdmin, senderIsAdmin } = await checkAdmin(sock, groupId, sender);
  if (!botIsAdmin) return "❌ Je dois être admin pour fermer le groupe.";
  if (!senderIsAdmin) return "⛔ Seuls les admins peuvent utiliser !mute.";

  try {
    await sock.groupSettingUpdate(groupId, "announcement");
    return "🔇 *Groupe fermé !* Seuls les admins peuvent écrire.";
  } catch (e) {
    return "❌ Erreur lors de la fermeture du groupe.";
  }
}

export async function unmuteCommand(sock, groupId, sender) {
  const { botIsAdmin, senderIsAdmin } = await checkAdmin(sock, groupId, sender);
  if (!botIsAdmin) return "❌ Je dois être admin pour ouvrir le groupe.";
  if (!senderIsAdmin) return "⛔ Seuls les admins peuvent utiliser !demute.";

  try {
    await sock.groupSettingUpdate(groupId, "not_announcement");
    return "🔊 *Groupe ouvert !* Tout le monde peut écrire.";
  } catch (e) {
    return "❌ Erreur lors de l'ouverture du groupe.";
  }
}