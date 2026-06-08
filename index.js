import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import dotenv from "dotenv";
dotenv.config();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  // Connexion automatique par pairing code
  if (!sock.authState.creds.registered) {
    const number = process.env.BOT_NUMBER.replace(/[^0-9]/g, "");
    const code = await sock.requestPairingCode(number);
    console.log(`\n🔑 Ton code de connexion : *${code}*`);
    console.log("👉 WhatsApp → Appareils connectés → Connecter → Saisir le code\n");
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log(`✅ ${process.env.BOT_NAME} connecté à WhatsApp !`);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();