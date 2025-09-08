const functions = require("firebase-functions");   // v6 => Cloud Functions 2nd gen (par défaut)

exports.ean2nc8 = functions.https.onRequest(async (req, res) => {
  try {
    // Autorise CORS simple
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).send("");

    const ean = String(req.query.ean || "").trim();

    // TODO: remplace cette démo par ta vraie logique EAN -> NC8
    return res.json({
      ok: true,
      ean: ean || "inconnu",
      message: "Fonction ean2nc8 déployée ✅"
    });
  } catch (err) {
    res.status(500).json({ ok:false, error: err?.message || String(err) });
  }
});
