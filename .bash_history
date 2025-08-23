} > "$sm"
echo -e "User-agent: *\nAllow: /\nSitemap: $SITE/sitemap.xml" > "$ROOT/robots.txt"

# -------------------------------------------
# 2) Section Contact & démo (+ CSS + JS)
# -------------------------------------------
TAG_FORM_HTML='<!-- contact-pack v1 -->'
TAG_FORM_CSS='/* == contact-pack v1 == */'
TAG_FORM_JS='/* == contact-pack v1 == */'

# CSS (léger, responsive)
if ! has "$TAG_FORM_CSS" "$CSS"; then
cat >> "$CSS" <<'CSS'
/* == contact-pack v1 == */
.form{max-width:820px;margin:0 auto;}
.form .row{display:flex;gap:14px;flex-wrap:wrap;}
.form .field{flex:1 1 240px;display:flex;flex-direction:column;}
.form label{font-weight:600;margin:6px 2px;}
.form input,.form textarea{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);
  border-radius:10px;color:inherit;padding:12px 12px;}
.form textarea{min-height:120px;resize:vertical;}
.form .hp{position:absolute!important;left:-9999px;top:-9999px;height:0;width:0;opacity:0}
.form .actions{display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap;}
.form .msg{opacity:.9}
@media(max-width:720px){ .form input,.form textarea{padding:11px 10px} }
CSS
fi

# HTML (ajout dans index.html, avant le footer)
IDX="$ROOT/index.html"
if [[ -f "$IDX" ]] && ! has "$TAG_FORM_HTML" "$IDX"; then
  # insère avant </footer> si présent, sinon avant </body>
  insert_point='</footer>'
  if ! grep -q '</footer>' "$IDX"; then insert_point='</body>'; fi

  tmp="$(mktemp)"
  awk -v TAG="$TAG_FORM_HTML" -v SITE="$SITE" -v IP="$insert_point" '
    BEGIN{IGNORECASE=1}
    index(tolower($0),tolower(IP)) && !done{
      print "  " TAG
      print "  <section id=\"contact\" class=\"section\">"
      print "    <h2>Contact & démo</h2>"
      print "    <p class=\"lead\">Dites-nous en plus sur votre contexte ; nous revenons vers vous rapidement.</p>"
      print "    <form id=\"contact-form\" class=\"form\" novalidate>"
      print "      <div class=\"row\">"
      print "        <div class=\"field\"><label for=\"cf-name\">Nom</label><input id=\"cf-name\" name=\"name\" required autocomplete=\"name\"></div>"
      print "        <div class=\"field\"><label for=\"cf-company\">Organisation</label><input id=\"cf-company\" name=\"company\" autocomplete=\"organization\"></div>"
      print "      </div>"
      print "      <div class=\"row\">"
      print "        <div class=\"field\"><label for=\"cf-email\">E-mail</label><input id=\"cf-email\" type=\"email\" name=\"email\" required autocomplete=\"email\"></div>"
      print "        <div class=\"field\"><label for=\"cf-phone\">Téléphone (optionnel)</label><input id=\"cf-phone\" type=\"tel\" name=\"phone\" autocomplete=\"tel\"></div>"
      print "      </div>"
      print "      <div class=\"row\"><div class=\"field\" style=\"flex-basis:100%\">"
      print "        <label for=\"cf-msg\">Message</label><textarea id=\"cf-msg\" name=\"message\" required placeholder=\"Votre besoin, périmètre, délais…\"></textarea>"
      print "      </div></div>"
      print "      <input class=\"hp\" type=\"text\" name=\"website\" tabindex=\"-1\" autocomplete=\"off\" aria-hidden=\"true\">"
      print "      <div class=\"actions\">"
      print "        <button class=\"btn\" type=\"submit\">Envoyer la demande</button>"
      print "        <span class=\"msg\" role=\"status\" aria-live=\"polite\"></span>"
      print "      </div>"
      print "    </form>"
      print "    <p class=\"note\">En soumettant, vous acceptez le traitement de vos données pour répondre à votre demande. Voir la page <a href=\"/confidentialite.html\">Confidentialité</a>.</p>"
      print "    <script>window.CONTACT_ENDPOINT = window.CONTACT_ENDPOINT || \"\"; /* Renseignez un endpoint (Formspree/Worker) si dispo */</script>"
      print "  </section>"
      done=1
    }
    {print}
  ' "$IDX" > "$tmp" && mv "$tmp" "$IDX"
fi

# JS (validation + envoi + anti-bot + rate limit + fallback démo)
if ! has "$TAG_FORM_JS" "$JS"; then
cat >> "$JS" <<'JS'
/* == contact-pack v1 == */
(function(){
  const form=document.querySelector('#contact-form'); if(!form) return;
  const msg=form.querySelector('.msg');
  const ok=t=>{ msg.textContent=t; msg.style.opacity=.95; };
  const bad=t=>{ msg.textContent=t; msg.style.opacity=.95; };
  const endpoint=(window.CONTACT_ENDPOINT||'').trim();

  const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd=new FormData(form);
    if(fd.get('website')){ ok('Merci !'); form.reset(); return; } // honeypot
    const payload={
      name:(fd.get('name')||'').toString().trim(),
      company:(fd.get('company')||'').toString().trim(),
      email:(fd.get('email')||'').toString().trim(),
      phone:(fd.get('phone')||'').toString().trim(),
      message:(fd.get('message')||'').toString().trim(),
      page: location.href,
      t: new Date().toISOString()
    };
    if(!payload.name || !emailRx.test(payload.email) || payload.message.length<5){
      bad('Vérifiez les champs requis.'); return;
    }
    const last=+localStorage.getItem('sqv_contact_last')||0;
    if(Date.now()-last < 60000){ bad('Trop de demandes. Réessayez dans une minute.'); return; }
    localStorage.setItem('sqv_contact_last', Date.now());

    ok('Envoi en cours…');
    if(!endpoint){
      console.info('[Contact DEMO]', payload);
      ok('Merci ! Votre demande est enregistrée (mode démo).');
      form.reset();
      return;
    }
    try{
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(r.ok){ ok('Merci ! Nous revenons vers vous rapidement.'); form.reset(); }
      else{ bad('Envoi impossible. Essayez encore ou contactez-nous directement.'); }
    }catch(err){
      bad('Réseau indisponible. Réessayez.');
    }
  });
})();
JS
fi

# -------------------------------------------
# 3) Cache-bust + commit + déploiement
# -------------------------------------------
ts=$(date +%s)
for f in "$ROOT"/*.html; do
  sed -i -E "s|(\\./style\\.css)(\\?v=[0-9]+)?|\\1?v=$ts|g; s|(app\\.js)(\\?v=[0-9]+)?|\\1?v=$ts|g" "$f"
done

if [[ -x ./deploy_now.sh ]]; then
  git add "$ROOT"/*.html "$CSS" "$JS" "$ROOT/sitemap.xml" "$ROOT/robots.txt" || true
  git commit -m "pack: SEO++ + Contact & démo + cache bust v$ts" || true
  ./deploy_now.sh
else
  echo "⚠️ deploy_now.sh non trouvé : commit/déploiement sautés."
fi

echo "✅ PACK SEO++ + CONTACT appliqué."
BASH

chmod +x scripts/pack_seo_plus_contact.sh
./scripts/pack_seo_plus_contact.sh
<script>window.CONTACT_ENDPOINT="https://formspree.io/f/XXXXXXXX";</script>
# --- PACK: définir CONTACT_ENDPOINT (Formspree/Worker) + cache-bust + deploy ---
cat > scripts/set_contact_endpoint.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
ROOT=sentinel_app/public
F="$ROOT/index.html"
EP="${1:-}"
[[ -z "$EP" ]] && { echo "Usage: $0 <endpoint-url>"; exit 1; }

# 1) Remplace la ligne injectée par le pack contact, ou ajoute le <script> si absent
if grep -q 'window.CONTACT_ENDPOINT' "$F"; then
  sed -i -E "s|window\.CONTACT_ENDPOINT\s*=\s*window\.CONTACT_ENDPOINT\s*\|\|\s*\"\"|window.CONTACT_ENDPOINT=\"$EP\"|" "$F"
  sed -i -E "s|window\.CONTACT_ENDPOINT\s*=\s*\"[^\"]*\"|window.CONTACT_ENDPOINT=\"$EP\"|" "$F"
else
  sed -i -E "s|</body>|  <script>window.CONTACT_ENDPOINT=\"$EP\";</script>\n</body>|" "$F"
fi

# 2) Cache-bust CSS/JS sur toutes les pages
ts=$(date +%s)
for h in "$ROOT"/*.html; do
  sed -i -E "s|(\\./style\\.css)(\\?v=[0-9]+)?|\\1?v=$ts|g; s|(app\\.js)(\\?v=[0-9]+)?|\\1?v=$ts|g" "$h"
done

# 3) Commit + déploiement (si script dispo)
git add "$F" "$ROOT"/*.html || true
git commit -m "chore(contact): set CONTACT_ENDPOINT -> $EP + cache bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠️ deploy_now.sh non trouvé : déploiement sauté."
echo "✅ CONTACT_ENDPOINT = $EP"
BASH

chmod +x scripts/set_contact_endpoint.sh
./scripts/set_contact_endpoint.sh "https://formspree.io/f/XXXXXXXX"
curl -s https://sentinel-fusion.pages.dev/index.html | grep -n 'CONTACT_ENDPOINT'
# --- PACK: Contact UX (toast + busy) + cache-bust + deploy ---
cat > scripts/pack_contact_toast.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"

# 1) CSS (toast + busy)
if ! grep -q '/* == contact: toast v1 ==' "$CSS"; then
cat >> "$CSS" <<'CSS'
/* == contact: toast v1 == */
.toast{position:fixed;left:50%;bottom:16px;transform:translate(-50%,120%);opacity:0;
  background:rgba(10,14,20,.9);color:#fff;border:1px solid rgba(255,255,255,.12);
  padding:10px 14px;border-radius:12px;backdrop-filter:saturate(120%) blur(8px);
  z-index:9999;transition:transform .25s ease,opacity .25s;pointer-events:none}
.toast.show{transform:translate(-50%,0);opacity:1}
.toast.ok{border-color:#74d0ff}
.toast.bad{border-color:#ff6a6a}
button.is-busy{pointer-events:none;opacity:.6}
@media (max-width:720px){.toast{width:calc(100% - 32px)}}
CSS
fi

# 2) JS (ok/bad -> toast + busy sur submit)
if ! grep -q '/* == contact: toast v1 == */' "$JS"; then
cat >> "$JS" <<'JS'
/* == contact: toast v1 == */
(()=>{ 
  function toast(msg, kind='ok'){
    let t=document.querySelector('.toast');
    if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.className='toast show ' + (kind==='bad'?'bad':'ok');
    t.textContent=msg;
    clearTimeout(window.__toastT); window.__toastT=setTimeout(()=>t.classList.remove('show'), 4000);
  }
  window.ok  = window.ok  || ((m)=>toast(m,'ok'));
  window.bad = window.bad || ((m)=>toast(m,'bad'));
  const form=document.querySelector('form[action="#contact"], form#contact, .contact form');
  if(form){
    const btn=form.querySelector('button[type="submit"], [type="submit"]');
    form.addEventListener('submit', ()=>{ btn&&btn.classList.add('is-busy'); setTimeout(()=>btn&&btn.classList.remove('is-busy'), 6000); });
  }
})();
JS
fi

# 3) Cache-bust + commit + deploy
ts=$(date +%s)
for h in "$ROOT"/*.html; do
  sed -i -E "s|(\\./style\\.css)(\\?v=[0-9]+)?|\\1?v=$ts|g; s|(app\\.js)(\\?v=[0-9]+)?|\\1?v=$ts|g" "$h"
done
git add "$CSS" "$JS" "$ROOT"/*.html || true
git commit -m "ux(contact): toast + busy + cache bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠️ deploy_now.sh non trouvé : déploiement sauté."
echo "✅ Pack Contact UX appliqué."
BASH

chmod +x scripts/pack_contact_toast.sh
./scripts/pack_contact_toast.sh
# --- PACK: VPN en réel (API proxy + UI légère) ---
cat > scripts/pack_vpn_real.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"

# 0) Arbo Pages Functions (API côté serveur)
mkdir -p functions/api/vpn

# functions/api/vpn/index.js : routeur simple
cat > functions/api/vpn/index.js <<'JS'
export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/vpn\/?/, ""); // status, peers, peers/:id/enable
  const upstream = (suffix="") => `${env.VPN_API.replace(/\/$/,'')}/${suffix.replace(/^\//,'')}`;

  // Sécurité: exiger token côté Worker
  const AUTH = `Bearer ${env.VPN_TOKEN}`;
  const stdHeaders = { 'Authorization': AUTH, 'Content-Type':'application/json' };

  // Helper: proxy JSON
  const proxy = async (method, target, body=null) => {
    const res = await fetch(target, { method, headers: stdHeaders, body: body?JSON.stringify(body):undefined });
    const text = await res.text();
    let data; try{ data = JSON.parse(text); } catch{ data = { raw:text }; }
    return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type':'application/json' }});
  };

  // Routes de base (adapte-les à ton orchestrateur)
  if (request.method === 'GET' && (path === '' || path === 'status')) {
    return proxy('GET', upstream('status'));
  }
  if (request.method === 'GET' && path === 'peers') {
    return proxy('GET', upstream('peers'));
  }
  // Toggle peer: POST /api/vpn/peers/:id/enable {enable:true|false}
  if (request.method === 'POST' && /^peers\/[^/]+\/enable$/.test(path)) {
    const id = path.split('/')[1];
    const body = await request.json().catch(()=>({}));
    // Exemples d'upstream à adapter:
    // - wg-easy: POST /clients/:id/enable {enabled:true|false}
    // - headscale: POST /api/machines/:id/route
    // - tailscale: POST /api/v2/tailnet/.../devices/:id/disable
    return proxy('POST', upstream(`peers/${id}/enable`), { enable: !!body.enable });
  }

  return new Response(JSON.stringify({ error:'Not found', path }), { status: 404, headers:{'Content-Type':'application/json'}});
}
JS

# 1) CSS (panneau & bouton)
if ! grep -q '/* == vpn: ui v1 ==' "$CSS"; then
cat >> "$CSS" <<'CSS'
/* == vpn: ui v1 == */
.vpn-chip{position:fixed; right:16px; bottom:16px; z-index:9998; padding:8px 12px; border-radius:999px;
  border:1px solid rgba(255,255,255,.14); background:rgba(10,14,20,.8); color:#fff; backdrop-filter:saturate(120%) blur(8px);}
.vpn-pane{position:fixed; right:16px; bottom:64px; width: min(420px,calc(100% - 32px)); max-height:60vh; overflow:auto; z-index:9999;
  background:rgba(10,14,20,.92); color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:12px;}
.vpn-pane h4{margin:.3rem 0 .5rem 0}
.vpn-list{display:flex; flex-direction:column; gap:6px}
.vpn-item{display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,.12);
  border-radius:10px; padding:6px 8px; background:rgba(255,255,255,.03)}
.vpn-item small{opacity:.8}
.vpn-item button{padding:6px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.18); background:transparent; color:#fff}
CSS
fi

# 2) JS (UI + appels API)
if ! grep -q '/* == vpn: ui v1 == */' "$JS"; then
cat >> "$JS" <<'JS'
/* == vpn: ui v1 == */
(()=>{

async function api(p, opt={}){
  const r = await fetch(`/api/vpn/${p}`, { headers:{'Accept':'application/json'}, ...opt });
  if(!r.ok) throw new Error(`API ${p}: ${r.status}`);
  return await r.json();
}

function el(tag, attrs={}, ...kids){
  const e=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=> (k in e)?(e[k]=v):e.setAttribute(k,v));
  kids.forEach(k=> e.append(k));
  return e;
}

async function render(){
  let pane=document.querySelector('.vpn-pane');
  if(!pane){ pane=el('div',{className:'vpn-pane'}); document.body.appendChild(pane); }
  pane.innerHTML='Statut…';
  try{
    const status = await api('status');      // { up:true, version:'...', iface:'wg0', ... }
    const peers  = await api('peers');       // [{id:'abc', name:'Laptop', online:true, rx:..., tx:...}, ...]
    const head   = el('div',{}, 
      el('h4',{},'VPN — statut'),
      el('div',{}, JSON.stringify(status))
    );
    const list = el('div',{className:'vpn-list'});
    (Array.isArray(peers)?peers:[]).forEach(p=>{
      const row = el('div',{className:'vpn-item'},
        el('div',{}, el('strong',{}, p.name||p.id), el('br'), el('small',{}, p.online?'en ligne':'hors ligne')),
        el('div',{}, el('button',{onclick:async ()=>{
          try{
            await api(`peers/${encodeURIComponent(p.id)}/enable`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({enable: !p.enabled})});
            location.reload();
          }catch(e){ (window.bad||alert)(e.message); }
        }}, (p.enabled===false?'Activer':'Désactiver')))
      );
      list.appendChild(row);
    });
    pane.replaceChildren(head, list);
  }catch(e){
    pane.textContent = `Erreur API: ${e.message}`;
  }
}

function ensureUI(){
  if(document.querySelector('.vpn-chip')) return;
  const chip = el('button',{className:'vpn-chip', title:'VPN'}, 'VPN');
  chip.addEventListener('click', render);
  document.body.appendChild(chip);
}
ensureUI();

})();
JS
fi

# 3) Cache-bust + commit + deploy
ts=$(date +%s)
for h in "$ROOT"/*.html; do
  sed -i -E "s|(\\./style\\.css)(\\?v=[0-9]+)?|\\1?v=$ts|g; s|(app\\.js)(\\?v=[0-9]+)?|\\1?v=$ts|g" "$h"
done
git add functions "$CSS" "$JS" "$ROOT"/*.html || true
git commit -m "vpn(real): API proxy + UI légère + cache bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠️ deploy_now.sh non trouvé : déploiement sauté."
echo "✅ Pack VPN appliqué."
BASH

chmod +x scripts/pack_vpn_real.sh
./scripts/pack_vpn_real.sh
# --- PACK: corriger l'injection CONTACT_ENDPOINT (purge + réinsertion propre) ---
cat > scripts/fix_contact_endpoint.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

ROOT=sentinel_app/public
EP="${1:-}"   # optionnel: ./scripts/fix_contact_endpoint.sh https://formspree.io/f/XXXXXXX

# Tente de récupérer la première valeur trouvée si non fournie
detect_ep(){
  local file="$1"
  grep -oE 'window\.CONTACT_ENDPOINT\s*=\s*"[^"]+"' "$file" \
    | head -1 | sed -E 's/.*="([^"]*)".*/\1/' || true
}

for f in "$ROOT"/*.html; do
  [[ -z "$EP" ]] && EP="$(detect_ep "$f")"
done
: "${EP:?Aucune valeur CONTACT_ENDPOINT détectée. Relance avec: ./scripts/fix_contact_endpoint.sh https://formspree.io/f/XXXXXXX}"

echo ">> CONTACT_ENDPOINT = $EP"

for f in "$ROOT"/*.html; do
  # 1) Supprime tout ce qui ressemble à l'ancienne injection (texte brut ou script)
  sed -i -E 's/window\.CONTACT_ENDPOINT\s*=\s*"[^"]*"\s*;?//g' "$f"
  sed -i -E '/<script[^>]*id="contact-endpoint"[^>]*>[^<]*<\/script>/Id' "$f"

  # Nettoyage d'interlignes en trop
  sed -i -E ':a;N;$!ba;s/\n{3,}/\n\n/g' "$f"

  # 2) Réinsère proprement UNE SEULE balise juste avant </body>
  if ! grep -qi 'id="contact-endpoint"' "$f"; then
    sed -i -E "s|</body>|<script id=\"contact-endpoint\">window.CONTACT_ENDPOINT=\"${EP}\";<\/script></body>|I" "$f"
  fi
done

# 3) Cache-bust + commit + deploy
ts=$(date +%s)
for f in "$ROOT"/*.html; do
  sed -i -E "s|(\\./style\\.css)(\\?v=[0-9]+)?|\\1?v=$ts|g; s|(app\\.js)(\\?v=[0-9]+)?|\\1?v=$ts|g" "$f"
done
git add "$ROOT"/*.html || true
git commit -m "fix(contact): injection unique <script id=contact-endpoint> + purge duplicates + cache bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠️ deploy_now.sh non trouvé : déploiement sauté."
echo "✅ CONTACT_ENDPOINT corrigé."
BASH

chmod +x scripts/fix_contact_endpoint.sh
./scripts/fix_contact_endpoint.sh
for p in / /presentation /modules /comparatif /editions /docs /entreprises /secteur-public /defense; do   echo -n "$p -> ";   curl -s "https://sentinel-fusion.pages.dev${p}.html" | grep -ci 'id="contact-endpoint"'; done
# Chaque ligne doit afficher : 1
curl -s https://formspree.io/f/XXXXXXXX   -H 'Accept: application/json'   -X POST   -d 'name=Test&email=ton@mail.test&message=Ping depuis SF'
# injecte proprement l’endpoint une seule fois + cache-bust + commit + déploiement
scripts/set_contact_endpoint.sh https://formspree.io/f/xzzvnvvp
scripts/pack_formspree_finish.sh https://formspree.io/f/xzzvnvvp
for p in / /presentation /modules /comparatif /editions /docs /entreprises /secteur-public /defense; do   echo -n "$p -> " && curl -s https://sentinel-fusion.pages.dev${p}.html | grep -ci 'id="contact-endpoint"'; done
cat > scripts/pack_formspree_finish.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

EP="${1:?Usage: $0 https://formspree.io/f/xxxxxxx}"
ROOT=sentinel_app/public
ts=$(date +%s)

# 0) Nettoie l'ancien format et injecte UNE SEULE balise juste avant </body>
for f in "$ROOT"/*.html; do
  # vire les vieilles lignes window.CONTACT_ENDPOINT "en vrac"
  sed -i -E 's/window\.CONTACT_ENDPOINT\s*=\s*\"[^"]*\";?//g' "$f"
  # supprime d'anciennes balises script id=contact-endpoint dupliquées
  sed -i -E 's#<script id="contact-endpoint">[^<]*</script>##g' "$f"
  # réinsère proprement 1 balise
  sed -i -E "s#</body>#<script id=\"contact-endpoint\">window.CONTACT_ENDPOINT=\"$EP\";</script>\n</body>#g" "$f"
done

# 1) Honeypot CSS (anti-spam) si absent
if ! grep -q '/* == contact: honeypot v1 == */' "$ROOT/style.css"; then
  cat >> "$ROOT/style.css" <<'CSS'
/* == contact: honeypot v1 == */
.hp{position:absolute !important; left:-9999px !important; opacity:0 !important;}
CSS
fi

# 2) Cache-bust CSS/JS
for f in "$ROOT"/*.html; do
  sed -i -E "s|(style\.css)(\?v=[0-9]+)?|\1?v=$ts|g; s|(app\.js)(\?v=[0-9]+)?|\1?v=$ts|g" "$f"
done

git add "$ROOT/style.css" "$ROOT"/*.html || true
git commit -m "ux(contact): finish pack (honeypot) + endpoint unique + cache bust v$ts" || true
[[ -x ./deploy_now.sh ]] && ./deploy_now.sh || echo "⚠ deploy_now.sh non trouvé : pas de déploiement auto."
BASH

chmod +x scripts/pack_formspree_finish.sh
# 1) Exécuter le pack "finish" avec TON endpoint Formspree
scripts/pack_formspree_finish.sh https://formspree.io/f/xzzvnvvp
# --- 1) Branche l’endpoint Formspree en prod ---
EP="https://formspree.io/f/xzzvnvvp"
scripts/pack_formspree_finish.sh "$EP"
#!/usr/bin/env bash
set -euo pipefail
ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"
EP="${1:-}"
detect_ep(){ # récupère un VNP_ENDPOINT déjà présent (si param manquant)
  grep -REo 'window\.VNP_ENDPOINT\s*=\s*"[^"]+"' "$ROOT"/*.html | head -1   | sed -E 's/.*="([^"]+)".*/\1/' || true; }
if [[ -z "${EP:-}" ]]; then EP="$(detect_ep)"; fi
if [[ -z "${EP:-}" ]]; then   echo "Usage: $0 <vnp-endpoint-url>"; exit 1; fi
#!/usr/bin/env bash
set -euo pipefail
ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"
EP="${1:-}"
detect_ep(){ # récupère un VNP_ENDPOINT déjà présent (si param manquant)
  grep -REo 'window\.VNP_ENDPOINT\s*=\s*"[^"]+"' "$ROOT"/*.html | head -1   | sed -E 's/.*="([^"]+)".*/\1/' || true; }
if [[ -z "${EP:-}" ]]; then EP="$(detect_ep)"; fi
if [[ -z "${EP:-}" ]]; then   echo "Usage: $0 <vnp-endpoint-url>"; exit 1; fi
