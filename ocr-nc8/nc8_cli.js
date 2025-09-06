#!/usr/bin/env node

// OCR -> EAN -> OFF -> NC8
// Exécution :
//   node nc8_cli.js 3560070888153

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// ===============================
// Config API
// ===============================

// API OpenFoodFacts
const OFF_PRODUCT_URL = (ean) =>
  `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;

// API fallback Douane (si tu en as un)
const DOUANE_SEARCH_URL =
  process.env.RITA_SEARCH_URL || "https://nomenclature.douane.gouv.fr/search";

// Table heuristique NC8
const HEURISTIC_NC8 = [
  { code: "0401", note: "Lait" },
  { code: "0402", note: "Lait concentré" },
  { code: "0902", note: "Thés" },
  { code: "0901", note: "Cafés" },
  { code: "1701", note: "Sucres" },
  { code: "2202", note: "Boissons sucrées" },
  { code: "1905", note: "Boulangerie/pâtisserie" },
  { code: "2106", note: "Préparations alimentaires" },
];

// ===============================
// Fonctions utilitaires
// ===============================

function guessNC8(product) {
  const categories = (product.categories_tags_fr || []).join(" ").toLowerCase();
  const matches = HEURISTIC_NC8.filter((h) =>
    categories.includes(h.note.toLowerCase())
  ).map((h) => ({ code: h.code, libelle: h.note, score: 0.9, source: "heuristic" }));
  return matches;
}

async function fetchOFF(ean) {
  try {
    const r = await fetch(OFF_PRODUCT_URL(ean));
    if (!r.ok) return { ok: false };
    const json = await r.json();
    return { ok: true, product: json.product };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ===============================
// Main
// ===============================

async function main() {
  const ean = process.argv[2];
  if (!ean) {
    console.error("Usage: node nc8_cli.js <EAN>");
    process.exit(1);
  }

  let out = {
    ean,
    productName: null,
    nc8Candidates: [],
    sources: [],
  };

  // 1) Essayer OFF
  const off = await fetchOFF(ean);
  if (off.ok && off.product) {
    out.productName = off.product.product_name || off.product.product_name_fr;
    out.nc8Candidates = guessNC8(off.product);
    out.sources.push({ kind: "openfoodfacts", ok: true });
  } else {
    out.sources.push({ kind: "openfoodfacts", ok: false });
  }

  // 2) Petit filetage sécurité : max 5 codes
  out.nc8Candidates = (out.nc8Candidates || []).slice(0, 5);

  // 3) Afficher résultat
  console.log("✅ Résultat final >>>");
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("❌ ERREUR :", e.message);
  process.exit(2);
});

