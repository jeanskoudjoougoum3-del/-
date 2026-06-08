import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import dotenv from "dotenv";
dotenv.config();

import { menuCommand } from "./commands/menu.js";
import { helpCommand } from "./commands/help.js";
import { infoCommand } from "./commands/info.js";
import { listCommand, trackMessage } from "./commands/list.js";
import { listAdminsCommand, trackAdminMessage } from "./commands/listadmins.js";
import { tagallCommand } from "./commands/tagall.js";
import { hasLink, handleAntilink } from "./commands/antilink.js";
import { hasMentionStory, handleAntistory } from "./commands/antistory.js";
import { banCommand } from "./commands/ban.js";
import { warnUser, resetWarnings } from "./commands/warn.js";
import { promoteCommand, demoteCommand } from "./commands/promote.js";
import { addCommand } from "./commands/add.js";
import { pairCommand } from "./commands/pair.js";
import { muteCommand, unmuteCommand } from "./commands/mute.js";
import { modeCommand, getBotMode } from "./commands/mode.js";
import { gsCommand } from "./commands/gs.js";

const groupSettings = new Map();

function getSettings(groupId) {
  if (!groupSettings.has(groupId)) {
    groupSettings.set(groupId, { antilink: false, antistory: false });
  }
  return groupSettings.get(groupId);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  // Pairing code automatique
  if (!sock.authState.creds.registered) {
    const number = process.env.BOT_NUMBER.replace(/[^0-9]/g, "");
    const code = await sock.requestPairingCode(number);
    console.log(`\n🔑 Code de connexion : *${code}*`);
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

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    const groupId = msg.key.remoteJid;
    const isGroup = groupId.endsWith("@g.us");
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text || "";

    // Tracking messages
    if (isGroup && text) {
      trackMessage(groupId, sender);
      const meta = await sock.groupMetadata(groupId);
      const isAdmin = meta.participants.find((p) => p.id === sender)?.admin;
      trackAdminMessage(groupId, sender, !!isAdmin);
    }

    const settings = getSettings(groupId);

    // Antilink automatique
    if (isGroup && settings.antilink && text && hasLink(text)) {
      const result = await warnUser(sock, groupId, sender, "envoi de lien interdit");
      await sock.sendMessage(groupId, { text: result.reply, mentions: result.mentions });
      if (!result.banned) await sock.sendMessage(groupId, { delete: msg.key });
      return;
    }

    // Antistory automatique
    if (isGroup && settings.antistory && hasMentionStory(msg)) {
      await handleAntistory(sock, msg, sender, groupId);
      return;
    }

    // Mode privé — ignore non-admins
    if (isGroup && text && !text.startsWith("!")) {
      const mode = getBotMode(groupId);
      if (mode === "private") {
        const meta = await sock.groupMetadata(groupId);
        const senderP = meta.participants.find((p) => p.id === sender);
        if (!senderP?.admin) return;
      }
    }

    if (!text) return;

    let reply = "";
    let mentionList = [];

    if (text.startsWith("!")) {
      const [command, ...args] = text.split(" ");
      const arg = args.join(" ");

      switch (command.toLowerCase()) {
        case "!menu":
          reply = menuCommand();
          break;

        case "!help":
          reply = helpCommand();
          break;

        case "!info":
          reply = infoCommand();
          break;

        case "!ping":
          reply = "🏓 Pong ! *𝗕𝗘𝗡𝗜𝗫 𝗗𝗘𝗩* est actif.";
          break;

        case "!list": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          reply = listCommand(groupId, meta.participants.map((p) => p.id));
          mentionList = meta.participants.map((p) => p.id);
          break;
        }

        case "!listadmins": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          reply = listAdminsCommand(groupId, meta.participants);
          mentionList = meta.participants.filter((p) => p.admin).map((p) => p.id);
          break;
        }

        case "!tagall": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          const result = tagallCommand(meta.participants, arg);
          reply = result.text;
          mentionList = result.mentions;
          break;
        }

        case "!ban": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const result = await banCommand(sock, msg, groupId, sender);
          reply = result.reply;
          mentionList = result.mentions;
          break;
        }

        case "!warn": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          const senderP = meta.participants.find((p) => p.id === sender);
          if (!senderP?.admin) { reply = "⛔ Seuls les admins peuvent utiliser !warn."; break; }
          const quoted = msg.message?.extendedTextMessage?.contextInfo;
          const target = quoted?.mentionedJid?.[0] || quoted?.participant;
          if (!target) { reply = "❌ Cite un message ou mentionne un membre."; break; }
          const result = await warnUser(sock, groupId, target, arg || "violation des règles");
          reply = result.reply;
          mentionList = result.mentions;
          break;
        }

        case "!resetwarn": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          const senderP = meta.participants.find((p) => p.id === sender);
          if (!senderP?.admin) { reply = "⛔ Seuls les admins peuvent utiliser !resetwarn."; break; }
          const quoted = msg.message?.extendedTextMessage?.contextInfo;
          const target = quoted?.mentionedJid?.[0] || quoted?.participant;
          if (!target) { reply = "❌ Cite un message ou mentionne un membre."; break; }
          resetWarnings(groupId, target);
          reply = `✅ Avertissements de @${target.split("@")[0]} réinitialisés.`;
          mentionList = [target];
          break;
        }

        case "!promote": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const result = await promoteCommand(sock, msg, groupId, sender);
          reply = result.reply;
          mentionList = result.mentions;
          break;
        }

        case "!demote": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const result = await demoteCommand(sock, msg, groupId, sender);
          reply = result.reply;
          mentionList = result.mentions;
          break;
        }

        case "!mute": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          reply = await muteCommand(sock, groupId, sender);
          break;
        }

        case "!demute": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          reply = await unmuteCommand(sock, groupId, sender);
          break;
        }

        case "!add": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          reply = await addCommand(sock, groupId, sender);
          break;
        }

        case "!pair":
          reply = await pairCommand(sock, arg);
          break;

        case "!mode": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          const meta = await sock.groupMetadata(groupId);
          reply = modeCommand(groupId, arg, sender, meta.participants);
          break;
        }

        case "!gs": {
          if (!isGroup) { reply = "❌ Commande réservée aux groupes."; break; }
          reply = await gsCommand(sock, msg, groupId);
          break;
        }

        default:
          reply = `❓ Commande inconnue. Tape *!menu* pour voir toutes les commandes.`;
      }
    }

    if (reply) {
      await sock.sendMessage(groupId, { text: reply, mentions: mentionList });
    }
  });
}

startBot();