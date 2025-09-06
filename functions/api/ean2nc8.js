const OFF = (ean) => `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`;

function guessNC8(product) {
  const tags = (product?.categories_tags_fr || product?.categories_tags || [])
               .join(' ').toLowerCase();
  const out = [];
  const push = (code, libelle, score) => out.push({ code, libelle, score });

  if (/\bth[eé]|\btea\b/.test(tags)) push('0902', 'Thés', 0.9);
  if (/\blait|cr[eè]me\b/.test(tags)) push('0401', 'Lait', 0.85);
  if (/\bchocolat|cacao\b/.test(tags)) push('1806', 'Chocolat', 0.9);
  if (/\bboisson|soda|jus\b/.test(tags)) push('2202', 'Boissons sucrées/aromatisées', 0.6);
  if (/\bcaf[eé]\b/.test(tags)) push('0901', 'Café', 0.8);
  if (!out.length) push('2106', 'Préparations alimentaires', 0.3);
  return out.slice(0,5);
}

export const onRequest = async ({ request }) => {
  try {
    const ean = new URL(request.url).searchParams.get('ean')?.trim();
    if (!ean || !/^\d{8,14}$/.test(ean)) {
      return new Response(JSON.stringify({ ok:false, error:'invalid_ean' }), { status:400 });
    }
    const r = await fetch(OFF(ean), { headers:{ 'user-agent':'akiprisaye/1.0' }});
    const j = await r.json();
    const prod = j?.product || null;

    const result = {
      ean,
      productName: prod?.product_name_fr || prod?.product_name || null,
      nc8Candidates: guessNC8(prod),
      sources: [{ kind:'openfoodfacts', ok: !!prod }]
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'content-type':'application/json; charset=utf-8',
                 'cache-control':'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500 });
  }
};
