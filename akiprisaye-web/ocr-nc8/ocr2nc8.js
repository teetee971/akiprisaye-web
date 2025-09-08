//!/usr/bin/env node
/* -----------------------------------------------------------
 * OCR/NC8 — EAN ⇄ OCR image -> OpenFoodFacts -> Candidats NC8
 * Usage:
 *   node ocr2nc8.js <chemin_image.jpg> [--lang=fra] [--psm=6]
 *   node ocr2nc8.js <ean13>
 * ---------------------------------------------------------*/

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { createWorker } from "tesseract.js";
import Jimp from "jimp";

/* ------------ Config ------------- */
const OFF_PRODUCT_URL = (ean) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    ean
  )}.json`;

/* ------------ Heuristiques NC8 (à enrichir) ------------- */
const HEURISTIC_NC8 = [
  { code: "0401", note: "Lait et crème non concentrés", keys: ["lait", "milk"] },
  { code: "0402", note: "Lait et crème concentrés / sucrés", keys: ["lait concentré"] },
  { code: "0403", note: "Babies’ food", keys: ["lait infantile", "bébé"] },
  { code: "1806", note: "Chocolat & préparations cacao", keys: ["chocolat", "cacao"] },
  { code: "1905", note: "Confiseries", keys: ["bonbon", "confiserie", "sucrerie"] },
  { code: "0902", note: "Thés", keys: ["thé", "the"] },
  { code: "0901", note: "Café", keys: ["café", "coffee", "expresso"] },
  { code: "0810", note: "Fruits frais", keys: ["pomme", "banane", "poire", "orange"] },
  { code: "2009", note: "Jus de fruits", keys: ["jus", "nectar"] },
  { code: "2202", note: "Boissons non alcooliques", keys: ["boisson", "soda", "limonade"] },
  { code: "2106", note: "Préparations alimentaires", keys: ["préparation", "instantané", "mix"] }
];

/* ------------ Utils ------------- */
function isLikelyEAN(str) {
  return /^[0-9]{8}$|^[0-9]{12,14}$/.test(String(str).trim());
}

function extractEANFromText(text) {
  if (!text) return null;
  // privilégie 13 chiffres (EAN-13)
  let m = text.match(/(?<!\d)\d{13}(?!\d)/);
  if (m) return m[0];
  // sinon cherche 8, 12, 14
  m = text.match(/(?<!\d)\d{8}(?!\d)|(?<!\d)\d{12}(?!\d)|(?<!\d)\d{14}(?!\d)/);
  return m ? m[0] : null;
}

async function preprocessImage(imgPath) {
  const img = await Jimp.read(imgPath);
  img
    .greyscale()
    .contrast(0.3)
    .normalize()
    .resize({ width: Math.min(2000, img.bitmap.width * 2) });
  const out = path.join(process.cwd(), "tmp-ocr.jpg");
  await img.writeAsync(out);
  return out;
}

async function ocrImageToEAN(imgPath, { lang = "fra", psm = 6 } = {}) {
  const pre = await preprocessImage(imgPath);
  const worker = await createWorker(lang, 1, { gzip: false });
  await worker.setParameters({ tessedit_pageseg_mode: String(psm) });
  const { data } = await worker.recognize(pre);
  await worker.terminate();
  const txt = (data && data.text) || "";
  return extractEANFromText(txt);
}

/* ------------ OpenFoodFacts ------------- */
async function fetchOFF(ean) {
  const r = await fetch(OFF_PRODUCT_URL(ean));
  if (!r.ok) {
    return { ok: false, status: r.status, url: OFF_PRODUCT_URL(ean) };
  }
  const j = await r.json();
  const p = j?.product;
  if (!p) return { ok: false, status: 404, url: OFF_PRODUCT_URL(ean) };
  const name =
    p.product_name_fr ||
    p.product_name ||
    p.generic_name_fr ||
    p.generic_name ||
    null;
  const brands = p.brands || "";
  const categories = p.categories_fr || p.categories || "";
  const categoriesTags =
    p.categories_tags_fr?.join(", ") || p.categories_tags?.join(", ") || "";
  return {
    ok: true,
    ean,
    productName: name,
    brands,
    categories: [categories, categoriesTags].filter(Boolean).join(", "),
    raw: p
  };
}

/* ------------ Heuristique -> candidats NC8 ------------- */
function guessNC8({ productName, brands, categories }) {
  const hay = `${productName || ""} ${brands || ""} ${categories || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, ""); // retire accents

  const hits = [];
  for (const row of HEURISTIC_NC8) {
    const count = row.keys.reduce((n, k) => {
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      return n + (hay.match(re)?.length || 0);
    }, 0);
    if (count > 0) {
      // score simple : nb de mots-clés trouvés / nb total
      const score = +(count / row.keys.length).toFixed(2);
      hits.push({ code: row.code, libelle: row.note, score, source: "heuristic" });
    }
  }
  // tri décroissant
  hits.sort((a, b) => b.score - a.score);
  // ne renvoyer que les meilleurs (score >= 0.25) et max 3
  return hits.filter(h => h.score >= 0.25).slice(0, 3);
}

/* ------------ Programme principal ------------- */
function parseCLI(argv) {
  const arg = argv[2];
  const opts = { lang: "fra", psm: 6 };
  for (const a of argv.slice(3)) {
    if (a.startsWith("--lang=")) opts.lang = a.split("=")[1];
    if (a.startsWith("--psm=")) opts.psm = Number(a.split("=")[1]);
  }
  return { arg, opts };
}

async function main() {
  const { arg, opts } = parseCLI(process.argv);
  if (!arg) {
    console.error("Usage: node ocr2nc8.js <image.jpg|ean13> [--lang=fra] [--psm=6]");
    process.exit(1);
  }

  let ean = null;
  let from = "cli-ean";
  if (isLikelyEAN(arg)) {
    ean = arg;
  } else {
    if (!fs.existsSync(arg)) {
      console.error("Fichier introuvable:", arg);
      process.exit(2);
    }
    from = "ocr";
    ean = await ocrImageToEAN(arg, opts);
  }

  if (!ean) {
    console.error("❌ Aucun EAN détecté.");
    process.exit(3);
  }

  const off = await fetchOFF(ean);
  if (!off.ok) {
    console.log("⚠️  Produit non trouvé dans OFF :", off.url);
    // on renvoie quand même un squelette
    console.log(JSON.stringify({ ean, nc8Candidates: [], text: null, sources: [{ kind: "openfoodfacts", ok: false }] }, null, 2));
    process.exit(0);
  }

  const candidates = guessNC8(off);
  const out = {
    ean,
    productName: off.productName,
    nc8Candidates: candidates,
    text: from === "ocr" ? "(extrait par OCR)" : null,
    sources: [{ kind: "openfoodfacts", ok: true }]
  };

  console.log("✅ Résultat final >>>");
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => {
  console.error("ERREUR:", e?.message || e);
  process.exit(10);
});
