// ocr-esl.js  (CommonJS pour éviter la config ESM)
const Tesseract = require("tesseract.js");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

if (process.argv.length < 3) {
  console.error("Usage: node ocr-esl.js <image_path>");
  process.exit(1);
}

const srcPath = process.argv[2];
const tmpPath = path.join(__dirname, ".tmp_ocr.jpg");

/**
 * Pré-traitement :
 * - passage en niveaux de gris
 * - augmentation du contraste
 * - léger sharpen
 * - binarisation douce (threshold) pour aider l’OCR sur étiquettes électroniques
 */
async function preprocess(input, output) {
  const img = await Jimp.read(input);
  img
    .grayscale()                  // N&B
    .contrast(0.35)               // contraste
    .normalize()                  // normalise l’histogramme
    .resize({ w: Math.max(img.width, 2000) }) // upscale doux si petit
    .gaussian(0.5)                // petit flou pour lisser le bruit
    .threshold({ max: 200 });     // binarisation légère

  await img.quality(90).writeAsync(output);
}

/** Extraction “robuste” depuis le texte OCR */
function parseESL(ocrText) {
  const text = ocrText.replace(/[ \s]+/g, " ").trim(); // normalise espaces

  // Prix : gère 1,90 / 1.90 / 1€90 / 1 € 90
  const priceMatch =
    text.match(/(\d{1,4}[,.]\d{2})\s*€?/) ||
    text.match(/(\d{1,4})\s*€\s*(\d{2})/);
  let price = null;
  if (priceMatch) {
    if (priceMatch.length === 3 && !priceMatch[1].includes(",") && !priceMatch[1].includes(".")) {
      price = Number(`${priceMatch[1]}.${priceMatch[2]}`);
    } else {
      price = Number(priceMatch[1].replace(",", "."));
    }
  }

  // Code-barres EAN13 : 13 chiffres consécutifs
  const eanMatch = text.match(/\b(\d{13})\b/);
  const ean13 = eanMatch ? eanMatch[1] : null;

  // Libellé produit : on prend les 1-2 premières lignes “textuelles”
  const lines = ocrText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const label = lines.slice(0, 2).join(" ").replace(/\s{2,}/g, " ");

  return { label, price, ean13, raw: ocrText };
}

(async () => {
  try {
    if (!fs.existsSync(srcPath)) {
      console.error("Fichier introuvable:", srcPath);
      process.exit(1);
    }

    // 1) Pré-traitement
    await preprocess(srcPath, tmpPath);

    // 2) OCR (français + anglais)
    const { data: { text } } = await Tesseract.recognize(tmpPath, "fra+eng", {
      tessedit_char_blacklist: "|~`_^",
    });

    // 3) Parsing
    const result = parseESL(text);

    // 4) Sortie JSON (prêt à envoyer à une API)
    console.log(JSON.stringify({
      ok: true,
      sourceImage: path.basename(srcPath),
      ...result
    }, null, 2));

    // Nettoyage
    fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2));
    try { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath); } catch {}
    process.exit(1);
  }
})();

