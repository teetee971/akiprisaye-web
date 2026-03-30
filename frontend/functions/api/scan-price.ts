export const onRequestPost: PagesFunction = async (context) => {
  const { imageBase64 } = await context.request.json();
  const GEMINI_API_KEY = (context.env as any).GEMINI_API_KEY;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "Analyse cette étiquette de prix antillaise et renvoie UNIQUEMENT un JSON avec les champs: name, brand, price (nombre), unit_price, is_promo (boolean), enseigne." },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
        ]
      }]
    })
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
};
