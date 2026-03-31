const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB (sécurité + limite payload)
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const GEMINI_TIMEOUT_MS = 25_000;
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const fenced = text.match(/\`\`\`json\s*([\s\S]*?)\`\`\`/i);

  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(url, payload) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastResponse = response;

      if (response.ok) {
        return response;
      }

      if (!GEMINI_RETRY_STATUSES.has(response.status) || attempt === GEMINI_MAX_ATTEMPTS) {
        return response;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt === GEMINI_MAX_ATTEMPTS) {
        break;
      }
    }

    const backoffMs = 400 * 2 ** (attempt - 1);
    await sleep(backoffMs);
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Échec de communication avec Gemini.');
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse({ error: 'Variable env GEMINI_API_KEY manquante.' }, 500);
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const scanType = formData.get('type') || 'catalog';

    if (!(image instanceof File)) {
      return jsonResponse({ error: "Le champ 'image' est requis." }, 400);
    }

    if (!ACCEPTED_IMAGE_TYPES.has((image.type || '').toLowerCase())) {
      return jsonResponse({ error: `Type de fichier non supporté: ${image.type || 'inconnu'}.` }, 415);
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return jsonResponse({ error: `Image trop volumineuse (${image.size} octets). Max autorisé: ${MAX_IMAGE_BYTES} octets.` }, 413);
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64Image = toBase64(arrayBuffer);

    const geminiPayload = {
      contents: [{
        parts: [
          { text: "Analyse cette photo de catalogue promo et renvoie uniquement un JSON valide avec la structure campaign, stores_applicable, products." },
          { inline_data: { mime_type: image.type || 'image/jpeg', data: base64Image } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
      contents: [
        {
          parts: [
            {
              text: scanType === 'receipt' 
                ? "Analyse ce ticket de caisse et renvoie uniquement un JSON valide avec la structure store, transaction, items."
                : "Analyse cette photo de catalogue promo et renvoie uniquement un JSON valide avec la structure campaign, stores_applicable, products.",
            },
            {
              inline_data: {
                mime_type: image.type || 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const geminiResponse = await callGeminiWithRetry(
      `${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      geminiPayload,
    );

    const geminiData = await safeJson(geminiResponse);
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

    if (!geminiResponse.ok) {
      return jsonResponse({ error: 'Erreur Gemini API.', details: geminiData }, geminiResponse.status);
    }

    const parts = geminiData?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean)
        .join('\n')
      : '';
    const parsed = extractJson(text);

    if (!parsed) {
      return jsonResponse({ error: 'Réponse Gemini non JSON.', raw: text }, 502);
    }

    return jsonResponse({ json: parsed });
  } catch (error) {
    return jsonResponse({ error: 'Erreur scan photo.', message: error instanceof Error ? error.message : String(error) }, 500);

  }
}
