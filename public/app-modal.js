/* Utilitaires d'échappement & affichage */
const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
const esc = (s)=>String(s??'').replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

/* Cache produits pour liaison item -> fiche */
window.productsCache = window.productsCache || [];

/* Ouvre/ferme la modale */
export function openProductModal(idx){
  const p = window.productsCache[idx]; if(!p) return;
  const modal = $("#product-modal"); if(!modal) return;

  /* Titre + image */
  $(".pm-title",modal).textContent = p.name || p.title || "Produit";
  const img = $(".pm-img",modal);
  img.src = p.image || p.img || "/img/placeholder.png";
  img.alt = p.name || "photo produit";

  /* Contenu extra: marque, enseigne, unité, etc. */
  const kv = $(".pm-kv",modal); kv.innerHTML = "";
  const addKV = (k,v)=>{ if(!v && v!==0) return;
    kv.insertAdjacentHTML("beforeend", `<div>${esc(k)}</div><div>${esc(v)}</div>`);
  };
  addKV("Enseigne", p.store || p.enseigne);
  addKV("Prix", p.price ? String(p.price) : (p.prix || null));
  addKV("Unité", p.unit || p.unite);
  addKV("Mise à jour", p.updatedAt || p.maj || p.updated || null);
  addKV("EAN", p.ean);

  /* Tags/NC8 si présents */
  const chips = $("#pm-chips",modal); chips.innerHTML = "";
  const tags = []
    .concat(p.nc8Candidates||[])
    .map(c => typeof c==='string' ? {code:c} : c)
    .slice(0,5);
  if(tags.length){
    tags.forEach(c=> chips.insertAdjacentHTML("beforeend",
      `<span class="pm-chip">${esc(c.code)}${c.libelle?(" · "+esc(c.libelle)):""}</span>`));
  }

  /* Reset messages */
  const extra = $("#pm-extra",modal); extra.innerHTML = "";

  /* Enrichissement OFF si EAN dispo */
  if(p.ean){
    fetch(`/api/ean2nc8?ean=${encodeURIComponent(p.ean)}`)
      .then(r=>r.ok?r.json():Promise.reject(new Error(r.status)))
      .then(j=>{
        // Info OFF
        if(j && j.productName){
          addKV("Nom OFF", j.productName);
        }
        if(j.nc8Candidates?.length){
          $("#pm-chips",modal).innerHTML = "";
          j.nc8Candidates.slice(0,5).forEach(c=>{
            $("#pm-chips",modal).insertAdjacentHTML("beforeend",
              `<span class="pm-chip">${esc(c.code)} · ${esc(c.libelle||"")}</span>`);
          });
        }
        if(j.text){
          extra.innerHTML = `<div style="margin-top:8px;opacity:.9">${esc(j.text)}</div>`;
        }
      })
      .catch(()=>{/* silencieux */});
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}
export function closeProductModal(){
  $("#product-modal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* Fermeture via fond & bouton */
document.addEventListener("click",(e)=>{
  if(e.target?.closest?.("#pm-close") || e.target?.id==="pm-close-btn") return closeProductModal();
  if(e.target?.id==="product-modal") return closeProductModal();
  if(e.target?.id==="pm-report") return openReportModal();
  if(e.target?.id==="cancel-report") return closeReportModal();
});

/* Hook minimal pour intégrer sur une liste existante
   Appelle cette fonction après avoir rendu les items. */
export function wireProductClicks(){
  $$(".js-product").forEach((el,idx)=>{
    el.onclick = ()=>openProductModal(idx);
  });
}

/* Fonctions de signalement */
let currentProductForReport = null;

export function openReportModal(){
  const productModal = $("#product-modal");
  const reportModal = $("#report-modal");
  if(!reportModal) return;
  
  // Stocker le produit actuel pour le signalement
  const productIdx = window.productsCache.findIndex(p => 
    p.name === $(".pm-title", productModal)?.textContent
  );
  if(productIdx >= 0) {
    currentProductForReport = window.productsCache[productIdx];
  }
  
  // Réinitialiser le formulaire
  $("#report-form").reset();
  $("#report-status").style.display = "none";
  
  reportModal.style.display = "block";
}

export function closeReportModal(){
  const reportModal = $("#report-modal");
  if(reportModal) {
    reportModal.style.display = "none";
  }
  currentProductForReport = null;
}

/* Gestion de soumission du formulaire de signalement */
document.addEventListener("DOMContentLoaded", () => {
  const reportForm = $("#report-form");
  if(reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleReportSubmission();
    });
  }
});

async function handleReportSubmission(){
  const reasonEl = $("#report-reason");
  const commentEl = $("#report-comment");
  const statusEl = $("#report-status");
  
  const reason = reasonEl?.value?.trim();
  const comment = commentEl?.value?.trim();
  
  if(!reason) {
    showReportStatus("Veuillez sélectionner un motif de signalement.", "error");
    return;
  }
  
  // Données du signalement
  const reportData = {
    product: currentProductForReport ? {
      name: currentProductForReport.name,
      store: currentProductForReport.store,
      price: currentProductForReport.price,
      ean: currentProductForReport.ean
    } : null,
    reason,
    comment,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  showReportStatus("Envoi du signalement en cours...", "info");
  
  try {
    // Tenter d'envoyer via API
    const response = await fetch('/api/signalement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });
    
    if(response.ok) {
      showReportStatus("Signalement envoyé avec succès. Merci pour votre contribution!", "success");
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    } else {
      throw new Error('Erreur serveur');
    }
  } catch(error) {
    console.warn('API non disponible, sauvegarde locale:', error);
    
    // Fallback : sauvegarde locale
    const reports = JSON.parse(localStorage.getItem('akp-reports') || '[]');
    reports.unshift(reportData);
    localStorage.setItem('akp-reports', JSON.stringify(reports.slice(0, 50))); // Garder max 50 signalements
    
    showReportStatus("Signalement enregistré localement. Il sera transmis lors de la prochaine synchronisation.", "success");
    setTimeout(() => {
      closeReportModal();
    }, 2000);
  }
}

function showReportStatus(message, type) {
  const statusEl = $("#report-status");
  if(!statusEl) return;
  
  statusEl.style.display = "block";
  statusEl.textContent = message;
  statusEl.className = type === "error" ? "status err" : 
                      type === "success" ? "status ok" : "status muted";
}
