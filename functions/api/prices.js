// functions/api/prices.js
import fetch from "node-fetch";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const territory = url.searchParams.get("territory") || "guadeloupe";

  // ⚠️ Remplace cette URL par ton API réelle dès que tu l’as
  const upstreamUrl = `https://ton-upstream/prices?territory=${territory}`;
  const res = await fetch(upstreamUrl);
  const items = await res.json();

  return new Response(JSON.stringify({
    territory,
    updatedAt: new Date().toISOString(),
    items
  }), {
    headers: { "content-type": "application/json" }
  });
}
