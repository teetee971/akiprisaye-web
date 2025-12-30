/**
 * scan-tools.js
 * - Auto-inject UI if [name="inci"] present
 * - Barcode scan: Quagga2 (CDN)
 * - Label OCR: Tesseract.js (CDN)
 * - Offline-first: register SW under /scan-tools/
 * - Symbol detection + Price compare (no scraping)
 */
import { detectSymbolsFromText } from "./symbol-detect.js";
import { getPriceCompare } from "./price-compare.js";

const CDN_QUAGGA = "https://unpkg.com/@ericblade/quagga2/dist/quagga.min.js";
const CDN_TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

const SW_PATH = "/scan-tools/offline-cache.js"; // IMPORTANT: public/ is served at root

function $(sel, root = document) { return root.querySelector(sel); }

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

function ensureCss() {
  if ($('link[data-scan-tools="1"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/scan-tools/scan-tools.css";
  link.setAttribute("data-scan-tools", "1");
  document.head.appendChild(link);
}

async function registerSW() {
  try {
    if (!("serviceWorker" in navigator)) return { ok:false, reason:"no-sw" };
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/scan-tools/" });
    return { ok:true, reg };
  } catch (e) {
    return { ok:false, reason: String(e && e.message ? e.message : e) };
  }
}

function setStatus(container, msg) {
  const el = $(".scan-status", container);
  if (el) el.textContent = msg || "";
}

function renderResults(container, { barcode, ocrText, symbols, price }) {
  const box = $(".scan-results", container);
  if (!box) return;

  const rows = [];
  if (barcode) rows.push(`<div class="row"><span class="badge">📦 Code: ${escapeHtml(barcode)}</span></div>`);
  if (symbols && symbols.length) {
    rows.push(`<div class="row">${symbols.map(s => `<span class="badge">${escapeHtml(s.label)}</span>`).join("")}</div>`);
  }
  if (price) {
    const src = (price.source || []).map(s => `<div class="row"><span class="badge">${escapeHtml(s.label)}: ${escapeHtml(s.note || "")}</span></div>`).join("");
    const links = (price.links || []).map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a>`).join("");
    rows.push(src);
    rows.push(`<div class="scan-links">${links}</div>`);
  }
  if (ocrText) {
    rows.push(`<div class="row"><span class="badge">🧾 OCR: ${escapeHtml(ocrText.slice(0, 180))}${ocrText.length>180?"…":""}</span></div>`);
  }

  box.innerHTML = rows.join("");
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function findFormTargets() {
  const inci = $('[name="inci"]');
  if (!inci) return null;

  const productName = $('[name="productName"]') || $('[name="product"]') || $('[name="name"]');
  const category = $('[name="category"]');

  return { inci, productName, category };
}

function injectUI(targets) {
  ensureCss();

  // Prevent double injection
  if ($(".scan-tools")) return null;

  const wrap = document.createElement("div");
  wrap.className = "scan-tools-wrap";

  wrap.innerHTML = `
    <div class="scan-tools">
      <button type="button" class="scan-btn" id="scan-barcode">Scanner code-barres</button>
      <button type="button" class="scan-btn" id="scan-label">Scanner étiquette</button>
      <button type="button" class="scan-btn" id="scan-price">Comparer les prix</button>
    </div>
    <div class="scan-status"></div>
    <div id="camera-preview" class="camera-preview" style="display:none;"></div>
    <input type="file" id="label-photo" accept="image/*" capture="environment" hidden />
    <div class="scan-results"></div>
    <p class="notice">
      Données extraites automatiquement depuis l’emballage.
      Vérifiez toujours avec le produit physique avant analyse.
    </p>
  `;

  // Insert just above INCI field
  targets.inci.parentNode.insertBefore(wrap, targets.inci);

  return wrap;
}

async function resolveBarcodeToForm(code, targets) {
  // Best-effort OpenBeautyFacts
  const url = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json || !json.product) {
    alert("Produit non trouvé (OpenBeautyFacts).");
    return { barcode: code, productName: "", category: "", ingredients: "" };
  }

  const productName = (json.product.product_name || "").trim();
  const category = (json.product.categories_tags && json.product.categories_tags[0]) ? json.product.categories_tags[0] : "";
  const ingredients = (json.product.ingredients_text || "").toUpperCase();

  // Pre-fill (user can edit)
  if (targets.productName) targets.productName.value = productName;
  if (targets.category) targets.category.value = category;
  if (ingredients) targets.inci.value = ingredients;

  return { barcode: code, productName, category, ingredients };
}

function extractINCIFromOCR(text) {
  const cleaned = (text || "")
    .replace(/\n/g, " ")
    .replace(/ingredients?\s*:/i, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  // Simple heuristic: detect segment starting around AQUA/WATER
  const match = cleaned.match(/(AQUA|WATER)\b.{20,700}/);
  if (!match) return { inci: "", cleaned };

  // Stop at typical end markers if present
  let inci = match[0];
  inci = inci.replace(/\bMADE IN\b.*$/i, "").trim();
  inci = inci.replace(/\bINGREDIENTS\b.*$/i, "").trim();

  return { inci, cleaned };
}

async function startBarcodeScan(container, targets, state) {
  const preview = $("#camera-preview", container);
  preview.style.display = "block";
  setStatus(container, "Ouverture caméra…");

  await loadScript(CDN_QUAGGA);

  // Quagga is global after script load
  const Quagga = window.Quagga;
  if (!Quagga) {
    setStatus(container, "Erreur: Quagga non chargé.");
    return;
  }

  // Avoid multiple listeners
  Quagga.offDetected && Quagga.offDetected();

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: preview,
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["ean_reader", "ean_13_reader", "upc_reader"] }
  }, (err) => {
    if (err) {
      setStatus(container, "Erreur caméra / initialisation.");
      return;
    }
    setStatus(container, "Scan en cours… aligne le code-barres.");
    Quagga.start();
  });

  Quagga.onDetected(async (data) => {
    try {
      Quagga.stop();
    } catch (_) {}
    preview.style.display = "none";

    const code = data && data.codeResult ? data.codeResult.code : "";
    if (!code) return;

    // User validation
    const ok = confirm(`Code détecté : ${code}\n\nValider pour pré-remplir ?`);
    if (!ok) return;

    setStatus(container, "Résolution du produit…");
    const filled = await resolveBarcodeToForm(code, targets);
    state.barcode = filled.barcode;
    state.productName = filled.productName || state.productName;

    const symbols = detectSymbolsFromText(targets.inci.value || "");
    const price = await getPriceCompare({ barcode: state.barcode, productName: state.productName });

    renderResults(container, { barcode: state.barcode, symbols, price });
    setStatus(container, navigator.onLine ? "Terminé." : "Analyse locale – données non synchronisées (offline).");
  });
}

async function startLabelOCR(container, targets, state) {
  const input = $("#label-photo", container);
  input.value = "";
  input.click();

  input.onchange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setStatus(container, "OCR en cours… (première fois peut être plus long)");
    await loadScript(CDN_TESSERACT);

    const Tesseract = window.Tesseract;
    if (!Tesseract) {
      setStatus(container, "Erreur: Tesseract non chargé.");
      return;
    }

    const ok = confirm("Lancer OCR et tenter extraction INCI ? (validation requise)");
    if (!ok) return;

    try {
      const result = await Tesseract.recognize(file, "eng+fra", {
        logger: m => console.log("[OCR]", m)
      });

      if (!result || !result.data || !result.data.text) {
        throw new Error("OCR_RESULT_INVALIDE");
      }

      const text = result.data.text.trim();

      if (!text) {
        throw new Error("OCR_TEXTE_VIDE");
      }

      // Log the raw OCR text securely to console for debugging (avoid sending to server)
      // Log only a fingerprint (SHA-256) + length for privacy-preserving debug
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        console.debug(`[OCR] fingerprint: sha256:${hashHex} length:${text.length}`);
      } catch (hashErr) {
        console.debug("[OCR] fingerprint failed", hashErr);
      }

      const { inci, cleaned } = extractINCIFromOCR(text);
      if (inci) {
        targets.inci.value = inci.replace(/\s+/g, " ").trim();
        state.ocrText = cleaned;
        const symbols = detectSymbolsFromText(cleaned);
        const price = await getPriceCompare({ barcode: state.barcode, productName: state.productName });

        renderResults(container, { barcode: state.barcode, ocrText: cleaned, symbols, price });
        setStatus(container, navigator.onLine ? "OCR terminé." : "Analyse locale – données non synchronisées (offline).");
      } else {
        state.ocrText = cleaned;
        renderResults(container, { barcode: state.barcode, ocrText: cleaned, symbols: [], price: null });
        alert("INCI non détectée automatiquement. Vérification manuelle requise.");
        setStatus(container, "OCR terminé (INCI non extraite).");
      }

    } catch (err) {
      console.error("❌ Erreur OCR :", err);
      alert(
        "Impossible d’analyser automatiquement l’étiquette.\n" +
        "Veuillez vérifier la photo (netteté, lumière) ou saisir manuellement."
      );
      setStatus(container, "OCR échoué.");
    }
  };
}

async function comparePrices(container, state) {
  setStatus(container, "Génération comparaison prix…");
  const price = await getPriceCompare({ barcode: state.barcode, productName: state.productName });
  renderResults(container, { barcode: state.barcode, symbols: [], price });
  setStatus(container, "Liens de comparaison prêts.");
}

async function bootstrap() {
  const targets = findFormTargets();
  if (!targets) return;

  const container = injectUI(targets);
  if (!container) return;

  const state = { barcode: "", productName: "", ocrText: "" };

  const sw = await registerSW();
  if (sw.ok) setStatus(container, "Offline prêt (Service Worker actif).");
  else setStatus(container, "Mode online (SW non actif) – scan disponible.");

  $("#scan-barcode", container).addEventListener("click", () => startBarcodeScan(container, targets, state));
  $("#scan-label", container).addEventListener("click", () => startLabelOCR(container, targets, state));
  $("#scan-price", container).addEventListener("click", () => comparePrices(container, state));
}

bootstrap();
