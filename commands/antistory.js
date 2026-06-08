export function hasMentionStory(msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || "";
  return (
    msg.message?.statusMentionMessage != null ||
    text.includes("a mentionné") ||
    text.includes("mentioned you") ||
    false
  );
}

export async function handleAntistory(sock, msg, sender, groupId) {
  try {
    await sock.sendMessage(groupId, {
      text: `⚠️ @${sender.split("@")[0]}, les mentions de story sont interdites ici !`,
      mentions: [sender],
    });
    await sock.sendMessage(groupId, { delete: msg.key });
  } catch (e) {
    console.error("Antistory error:", e);
  }
}