const functions = require("firebase-functions");

// Conversion EAN -> NC8 (stub pour test)
async function getNC8FromEAN(ean) {
  return {
    ean,
    productName: "Produit test",
    nc8Candidates: [{ code: "0902", libelle: "Thés", score: 0.9 }],
  };
}

// HTTP endpoint
exports.ean2nc8 = functions.https.onRequest(async (req, res) => {
  try {
    const { ean } = req.query;
    const result = await getNC8FromEAN(ean);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
