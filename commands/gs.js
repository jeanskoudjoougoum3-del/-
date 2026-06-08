import { downloadMediaMessage } from "@whiskeysockets/baileys";

export async function gsCommand(sock, msg, groupId) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const videoMsg = quoted?.videoMessage || msg.message?.videoMessage;

  if (!videoMsg) return "❌ Envoie ou cite une vidéo avec *!gs*.";

  try {
    const buffer = await downloadMediaMessage(
      { message: quoted ? { videoMessage: videoMsg } : msg.message },
      "buffer",
      {}
    );

    await sock.sendMessage("status@broadcast", {
      video: buffer,
      caption: "📹 Story du groupe",
      statusJidList: [groupId],
    });

    return "✅ Vidéo publiée en story du groupe !";
  } catch (e) {
    return "❌ Erreur lors de la publication.";
  }
}