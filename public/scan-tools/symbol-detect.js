/**
 * symbol-detect.js
 * Heuristic detection from OCR text (regex + keywords).
 */
export function detectSymbolsFromText(rawText) {
  const t = (rawText || "").toUpperCase();

  const symbols = [];

  // PAO: e.g., 6M, 12M, 24M
  const pao = t.match(/(\b\d{1,2}\s*M\b)/);
  if (pao) symbols.push({ type: "PAO", label: `🧴 PAO : ${pao[1].replace(/\s+/g,"")} après ouverture` });

  // Recycling materials
  if (/\bPET\b/.test(t) || /POLYETHYLENE TEREPHTHALATE/.test(t)) symbols.push({ type: "RECYCLE", label: "♻️ Emballage : PET (recyclable selon filière)" });
  if (/\bHDPE\b/.test(t) || /\bPEHD\b/.test(t)) symbols.push({ type: "RECYCLE", label: "♻️ Emballage : HDPE/PEHD (recyclable selon filière)" });
  if (/\bPP\b/.test(t) || /\bPOLYPROPYLENE\b/.test(t)) symbols.push({ type: "RECYCLE", label: "♻️ Emballage : PP (recyclable selon filière)" });

  // Triman / French sorting
  if (t.includes("TRIMAN") || t.includes("INFO-TRI") || t.includes("INFOTRI") || t.includes("INFO TRI")) {
    symbols.push({ type: "TRI", label: "⚠️ Consigne de tri : présence d’un marquage (Triman / Info-tri)" });
  }

  // Green dot / Point vert (keyword only)
  if (t.includes("POINT VERT") || t.includes("GREEN DOT")) {
    symbols.push({ type: "GREEN_DOT", label: "♻️ Point Vert : contribution filière (ne garantit pas recyclabilité)" });
  }

  // Flammable
  if (t.includes("INFLAMMABLE") || t.includes("FLAMMABLE") || t.includes("KEEP AWAY FROM FIRE")) {
    symbols.push({ type: "FLAM", label: "🔥 Avertissement : inflammable / éloigner des flammes" });
  }

  // EU cosmetics pot open (keyword only)
  if (t.includes("PERIOD AFTER OPENING") || t.includes("PAO")) {
    symbols.push({ type: "PAO_HINT", label: "🧴 Indice : mention PAO détectée" });
  }

  return symbols;
}
