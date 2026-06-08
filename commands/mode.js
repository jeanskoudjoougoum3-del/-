const botMode = new Map();

export function setBotMode(groupId, mode) {
  botMode.set(groupId, mode);
}

export function getBotMode(groupId) {
  return botMode.get(groupId) || "public";
}

export function modeCommand(groupId, mode, sender, participants) {
  const senderP = participants.find((p) => p.id === sender);
  if (!senderP?.admin) return "⛔ Seuls les admins peuvent changer le mode.";
  if (mode !== "public" && mode !== "private") return "❌ *Usage :* !mode public | !mode private";

  setBotMode(groupId, mode);
  return mode === "private"
    ? "🔒 *Mode privé activé !*\nLe bot répond uniquement aux *admins*."
    : "🌐 *Mode public activé !*\nLe bot répond à *tous les membres*.";
}