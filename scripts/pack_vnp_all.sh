#!/usr/bin/env bash
set -euo pipefail

ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"
EP="${1:-}"

detect_ep(){ # tente de récupérer un endpoint déjà présent
  grep -REo 'window\.(VNP_ENDPOINT|CONTACT_ENDPOINT)\s*=\s*"[^"]+"' "$ROOT"/*.html 2>/dev/null \
  | head -1 | sed -E 's/.*="([^"]+)".*/\1/' || true
}

if [[ -z "${EP:-}" ]]; then EP="$(detect_ep)"; fi
if [[ -z "${EP:-}" ]]; then
  echo "Usage: $0 <vnp-endpoint-url>"; exit 1
fi

# ---------- 1) CSS (modal + toast + fab) ----------
if ! grep -q '/* == vnp:modal v1 == */' "$CSS"; then
cat >> "$CSS" <<'CSS'
/* == vnp:modal v1 == */
.vnp-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,14,20,.6);z-index:9999}
.vnp-modal.open{display:flex}
.vnp-card{width:min(520px,94vw);background:rgba(255,255,255,.03);backdrop-filter:saturate(120%) blur(8px);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:16px}
.vnp-card h3{margin:.2em 0 .6em}
.vnp-row{display:flex;gap:8px}.vnp-row>*{flex:1}
.vnp-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
.vnp-toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(24px);opacity:0;background:rgba(16,24,32,.9);color:#fff;border:1px solid rgba(255,255,255,.12);padding:10px 14px;border-radius:10px;z-index:10000;transition:transform .25s,opacity .25s}
.vnp-toast.show{transform:translateX(-50%) translateY(0);opacity:1}
.is-busy{pointer-events:none;opacity:.6}
@media (max-width:720px){.vnp-card{padding:14px}}
/* == vnp:fab v1 == */
.vnp-fab{position:fixed;right:16px;bottom:16px;z-index:9998;display:none}
.has-vnp .vnp-fab{display:block}
CSS
fi

# ---------- 2) JS (UI + envoi JSON) ----------
if ! grep -q '// == vnp:ui v1 ==' "$JS"; then
cat >> "$JS" <<'JS'
// == vnp:ui v1 ==
(function(){
  const EP = window.VNP_ENDPOINT||'';
  function vnpToast(msg){
    let t=document.querySelector('.vnp-toast');
    if(!t){ t=document.createElement('div'); t.className='vnp-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); clearTimeout(t._to);
    t._to=setTimeout(()=>t.classList.remove('show'),2600);
  }
  function ensureModal(){
    let m=document.querySelector('.vnp-modal'); if(m) return m;
    m=document.createElement('div'); m.className='vnp-modal';
    m.innerHTML='<div class="vnp-card"><h3>Bouclier mobile — activation</h3>\
      <form class="vnp-form" novalidate>\
        <input class="hp" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0">\
        <div class="vnp-row">\
          <label>Téléphone*<br><input type="tel" name="phone" required placeholder="+33…"></label>\
          <label>Plateforme<br><select name="platform"><option>Android</option><option>iOS</option></select></label>\
        </div>\
        <label>E-mail (optionnel)<br><input type="email" name="email" placeholder="vous@exemple.fr"></label>\
        <label>Message (optionnel)<br><textarea name="message" rows="3" placeholder="Contexte, besoins…"></textarea></label>\
        <div class="vnp-actions"><button type="button" data-cancel>Fermer</button><button type="submit" class="btn">Activer</button></div>\
      </form></div>';
    document.body.appendChild(m);
    m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('open'); });
    m.querySelector('[data-cancel]').addEventListener('click',()=>m.classList.remove('open'));
    const form=m.querySelector('form');
    form.addEventListener('submit',async(ev)=>{
      ev.preventDefault(); if(!EP){ vnpToast('Endpoint VNP manquant.'); return; }
      const fd=new FormData(form);
      const phone=(fd.get('phone')||'').toString().trim();
      if(phone.length<5){ vnpToast('Téléphone invalide.'); return; }
      const payload={
        phone, platform:(fd.get('platform')||'').toString(),
        email:(fd.get('email')||'').toString().trim(),
        message:(fd.get('message')||'').toString().trim(),
        page:location.href, t:new Date().toISOString()
      };
      const btn=form.querySelector('[type="submit"]'); btn.classList.add('is-busy');
      try{
        const r=await fetch(EP,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify(payload)
        });
        if(r.ok){ vnpToast('Demande envoyée.'); form.reset(); m.classList.remove('open'); }
        else{ vnpToast('Échec envoi.'); }
      }catch(_){ vnpToast('Réseau indisponible.'); }
      btn.classList.remove('is-busy');
    });
    return m;
  }
  function open(){ ensureModal().classList.add('open'); }
  document.querySelectorAll('a[href="#vnp"],[data-vnp],.js-vnp-open').forEach(el=>{
    el.addEventListener('click',e=>{ e.preventDefault(); open(); });
  });
  if (matchMedia('(max-width:720px)').matches){
    const src=document.querySelector('a[href="#vnp"],[data-vnp],.js-vnp-open');
    if(src){
      const fab=document.createElement('div'); fab.className='vnp-fab';
      const cta=src.cloneNode(true); cta.textContent=src.textContent||'Activer le bouclier';
      fab.appendChild(cta); document.body.appendChild(fab); document.body.classList.add('has-vnp');
      cta.addEventListener('click',e=>{ e.preventDefault(); open(); });
    }
  }
})();
JS
fi

# ---------- 3) Injection unique de l’endpoint ----------
for f in "$ROOT"/*.html; do
  sed -i -E 's/window\.(VNP_ENDPOINT|CONTACT_ENDPOINT)[^<]*//g' "$f"
  sed -i -E 's#<script id="vnp-endpoint"[^<]*</script>##g' "$f"
  if grep -qi '</body>' "$f"; then
    sed -i "s#</body>#<script id=\"vnp-endpoint\">window.VNP_ENDPOINT=\"$EP\";</script>\n</body>#g" "$f"
  fi
done

# ---------- 4) Cache-bust ----------
ts=$(date +%s)
for f in "$ROOT"/*.html; do
  sed -i -E "s|(style\.css)(\?v=[0-9]+)?|\1?v=$ts|g; s|(app\.js)(\?v=[0-9]+)?|\1?v=$ts|g" "$f"
done

# ---------- 5) Commit + déploiement (si script présent) ----------
git add "$CSS" "$JS" "$ROOT"/*.html || true
git commit -m "ux(vnp): modal + CTA + endpoint + cache-bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠ deploy_now.sh non trouvé : pas de déploiement auto."
echo "✅ Pack VNP appliqué. Endpoint = $EP"
