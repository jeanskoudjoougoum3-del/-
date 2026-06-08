export async function addCommand(sock, groupId, sender) {
  const meta = await sock.groupMetadata(groupId);
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const botP = meta.participants.find((p) => p.id === botId);
  const senderP = meta.participants.find((p) => p.id === sender);

  if (!botP?.admin) return "❌ Je dois être admin pour générer le lien.";
  if (!senderP?.admin) return "⛔ Seuls les admins peuvent utiliser !add.";

  try {
    const code = await sock.groupInviteCode(groupId);
    return `🔗 *Lien d'invitation :*\nhttps://chat.whatsapp.com/${code}\n\n⚠️ _Ne partage ce lien qu'avec des personnes de confiance !_`;
  } catch (e) {
    return "❌ Erreur lors de la génération du lien.";
  }
}