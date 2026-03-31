export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Vérifier la clé API
  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Clé API manquante sur Cloudflare" }), { status: 500 });
  }

  try {
    const { imageBase64 } = await request.json();

    // 2. Appel à l'API Gemini de Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyse cette image d'étiquette de prix. Retourne UNIQUEMENT un objet JSON avec 'name' (nom du produit) et 'price' (nombre). Exemple: {\"name\": \"Lait 1L\", \"price\": 1.50}. Si tu ne vois rien, retourne {\"name\": \"Inconnu\", \"price\": 0}." },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
