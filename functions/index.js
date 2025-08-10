const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyANtqBDJD9UWg2VZ8yPycZ3icByRjUOShY");

exports.askGemini = functions.https.onRequest(async (req, res) => {
  try {
    const prompt = req.body.prompt || "Donne-moi une astuce de consommation locale.";
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).send({ reply: text });
  } catch (error) {
    console.error("Erreur Gemini:", error);
    res.status(500).send({ error: "Erreur lors de la génération Gemini." });
  }
});