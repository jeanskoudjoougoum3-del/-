export async function pairCommand(sock, phoneNumber) {
  if (!phoneNumber) {
    return "❌ *Usage :* !pair +2250XXXXXXXXX\n_(Numéro avec indicatif pays)_";
  }

  const cleaned = phoneNumber.replace(/[^0-9]/g, "");

  try {
    const code = await sock.requestPairingCode(cleaned);
    return `📱 *Code de jumelage :*\n\n🔑 *${code}*\n\n_WhatsApp → Appareils connectés → Connecter → Saisir le code_`;
  } catch (e) {
    console.error("Pair error:", e);
    return "❌ Erreur de jumelage. Vérifie le numéro et réessaie.";
  }
}