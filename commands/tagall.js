export function tagallCommand(participants, customMsg = "") {
  const mentions = participants.map((p) => p.id);

  let text = customMsg
    ? `📢 *${customMsg}*\n\n`
    : "📢 *Appel général !*\n\n";

  mentions.forEach((id) => {
    text += `@${id.split("@")[0]}\n`;
  });

  return { text, mentions };
}