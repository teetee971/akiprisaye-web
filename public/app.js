/* ---- Rendu liste & interactions ----
   Hypothèse : tu appelles renderResults(items) avec des objets:
   { name, brand, imageUrl, price, unit, storeName, ean }
*/
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

/** Rend la liste des produits */
export function renderResults(items=[]) {
  const list = $("#results-list");
  if(!list) return;
  list.innerHTML = items.map((p, idx) => {
    const img = p.imageUrl || "/img/placeholder.png";
    const name = p.name || "Produit";
    const brand = p.brand || "";
    const price = p.price ?? "";
    const unit = p.unit || "";
    const store = p.storeName || "";
    const ean = p.ean || "";
    return `
      <li class="result-row" 
          data-idx="${idx}"
          data-name="${escapeHtml(name)}"
          data-brand="${escapeHtml(brand)}"
          data-price="${escapeHtml(String(price))}"
          data-unit="${escapeHtml(unit)}"
          data-store="${escapeHtml(store)}"
          data-ean="${escapeHtml(ean)}"
          data-image="${escapeHtml(img)}">
        <div class="row px-3 py-3 flex gap-3 items-center">
          <img src="${img}" alt="" width="56" height="56" style="border-radius:10px;object-fit:cover;background:#0b1220"/>
          <div class="flex-1">
            <div class="text-base font-semibold">${escapeHtml(name)}</div>
            <div class="text-sm opacity-70">${escapeHtml(brand)}</div>
          </div>
          <div class="w-24 text-right">
            <div class="font-semibold">${price !== "" ? escapeHtml(String(price)) : "-"}</div>
            <div class="opacity-70 text-sm">${escapeHtml(unit)}</div>
          </div>
        </div>
      </li>`;
  }).join("");
}

/** Event delegation pour ouvrir la fiche */
document.addEventListener("click", async (ev) => {
  const row = ev.target.closest(".result-row");
  if(!row) return;

  const data = {
    name: row.dataset.name,
    brand: row.dataset.brand,
    price: row.dataset.price,
    unit: row.dataset.unit,
    store: row.dataset.store,
    ean: row.dataset.ean,
    image: row.dataset.image
  };
  await openProductModal(data);
});

/** FICHE PRODUIT (modal) + enrichissement OFF si EAN présent */
async function openProductModal(p) {
  const modal = $("#product-modal");
  const title = $("#pm-title");
  const img = $("#pm-img");
  const info = $("#pm-info");
  const extra = $("#pm-extra");

  title.textContent = p.name || "Produit";
  img.src = p.image || "/img/placeholder.png";
  img.alt = p.name || "";

  info.innerHTML = `
    <div><b>Marque :</b> ${safe(p.brand) || "—"}</div>
    <div><b>Magasin :</b> ${safe(p.store) || "—"}</div>
    <div><b>Prix :</b> ${safe(p.price) || "—"} <span class="opacity-70">${safe(p.unit) || ""}</span></div>
    <div><b>EAN :</b> ${safe(p.ean) || "—"}</div>
  `;

  // Reset bloc OFF
  extra.innerHTML = `<div class="opacity-70">Chargement des infos complémentaires…</div>`;

  // Enrichissement via OpenFoodFacts si on a un EAN (facultatif)
  if (p.ean && /^\d{8,14}$/.test(p.ean)) {
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(p.ean)}.json`);
      const j = await r.json();
      if (j && j.product) {
        const prod = j.product;
        const nutr = prod.nutriments || {};
        extra.innerHTML = `
          <div><b>Nom OFF :</b> ${safe(prod.product_name)}</div>
          <div><b>Catégories :</b> ${safe(prod.categories_fr || prod.categories)}</div>
          <div><b>Nutri-Score :</b> ${safe(prod.nutriscore_grade || "").toUpperCase() || "—"}</div>
          <div><b>Énergie :</b> ${nutr["energy-kcal_100g"] ? nutr["energy-kcal_100g"]+" kcal/100g" : "—"}</div>
          <div><b>Sucre :</b> ${nutr.sugars_100g != null ? nutr.sugars_100g+" g/100g" : "—"}</div>
          <div class="opacity-60 text-sm mt-2">Source : OpenFoodFacts</div>
        `;
      } else {
        extra.innerHTML = `<div class="opacity-70">Aucune donnée trouvée dans OFF.</div>`;
      }
    } catch(e) {
      extra.innerHTML = `<div class="opacity-70">OFF indisponible (${e?.message||"erreur"}).</div>`;
    }
  } else {
    extra.innerHTML = `<div class="opacity-70">Pas d’EAN disponible pour ce produit.</div>`;
  }

  modal.classList.add("open");
}

/** Fermer le modal */
$("#pm-close")?.addEventListener("click", () => $("#product-modal")?.classList.remove("open"));
$("#product-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "product-modal") $("#product-modal").classList.remove("open");
});

/** petits helpers */
function escapeHtml(s=""){return s.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));}
function safe(v){return v==null?"":escapeHtml(String(v));}

/* ---- Si ton code existant fait déjà un rendu, assure-toi qu'il appelle renderResults([...]) ---- */
/* Exemple:
fetch('/data/search?q=lait&territoire=martinique').then(r=>r.json()).then(items => renderResults(items));
*/
