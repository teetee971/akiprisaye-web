import axios from "axios";
import { writeFile } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";

export async function fetchOFFByBarcode(baseUrl, code) {
  const url = `${baseUrl}/api/v0/product/${code}.json`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data?.product || null;
}

export async function fetchOFFBySearch(baseUrl, query) {
  const url = `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data?.products?.[0] || null;
}

export function mapOFFProduct(p, imageFieldOrder = []) {
  const pick = (obj, keyPath) =>
    keyPath.split(".").reduce((a, k) => (a && k in a ? a[k] : undefined), p);

  let image = null;
  for (const k of imageFieldOrder) {
    const v = pick(p, k);
    if (typeof v === "string" && v.startsWith("http")) { image = v; break; }
  }
  if (!image && typeof p.image_url === "string") image = p.image_url;

  const ingredients = Array.isArray(p.ingredients)
    ? p.ingredients.map(i => i.text).filter(Boolean)
    : (p.ingredients_text || "").split(",").map(s => s.trim()).filter(Boolean);

  const nutrigrade = (p.nutriscore_grade || p.nutriscore_score || p.nutrition_grade_fr || "").toString().toUpperCase();

  return {
    source: "OFF",
    code: p.code,
    name: p.product_name || p.generic_name || p.brands || "Produit",
    brand: p.brands || null,
    quantity: p.quantity || null,
    categories: (p.categories || "").split(",").map(s=>s.trim()).filter(Boolean),
    ingredients,
    image,
    nutrigrade,
    nutriscore: nutrigrade ? { grade: nutrigrade, score: p.nutriscore_score ?? null } : null
  };
}

export async function downloadImage(url, outPath) {
  const writer = createWriteStream(outPath);
  const res = await axios.get(url, { responseType: "stream", timeout: 20000 });
  await new Promise((resolve, reject) => {
    res.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

export async function safeDownload(url, outPath) {
  try { await downloadImage(url, outPath); return true; }
  catch { return false; }
}
