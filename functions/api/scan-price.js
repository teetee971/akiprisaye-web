const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/\`\`\`json\s*([\s\S]*?)\`\`\`/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse({ error: 'Variable env GEMINI_API_KEY manquante.' }, 500);
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!(image instanceof File)) {
      return jsonResponse({ error: "Le champ 'image' est requis." }, 400);
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const geminiPayload = {
      contents: [{
        parts: [
          { text: "Analyse cette photo de catalogue promo et renvoie uniquement un JSON valide avec la structure campaign, stores_applicable, products." },
          { inline_data: { mime_type: image.type || 'image/jpeg', data: base64Image } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = typeof text === 'string' ? extractJson(text) : text;

    return jsonResponse({ json: parsed || text });
  } catch (error) {
    return jsonResponse({ error: 'Erreur scan photo.', message: error.message }, 500);
  }
}
