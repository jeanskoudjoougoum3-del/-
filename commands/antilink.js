const URL_REGEX = /(https?:\/\/|www\.)[^\s]+|chat\.whatsapp\.com\/[^\s]+/gi;

export function hasLink(text) {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
}

export async function handleAntilink(sock, msg, sender, groupId) {
  try {
    await sock.sendMessage(groupId, {
      text: `⚠️ @${sender.split("@")[0]}, les liens sont interdits dans ce groupe !`,
      mentions: [sender],
    });
    await sock.sendMessage(groupId, { delete: msg.key });
  } catch (e) {
    console.error("Antilink error:", e);
  }
}