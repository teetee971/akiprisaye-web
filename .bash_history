    let m=document.querySelector('.vnp-modal'); if(m) return m;
    m=document.createElement('div'); m.className='vnp-modal';
    m.innerHTML='<div class="box"><h3>Bouclier mobile — activation</h3>\
<form class="vnp-form" novalidate>\
  <input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" />\
  <label>Téléphone</label><input type="tel" name="phone" required placeholder="+33...">\
  <label>Plateforme</label><select name="platform"><option>Android</option><option>iOS</option></select>\
  <label>E-mail (optionnel)</label><input type="email" name="email" placeholder="vous@exemple.fr">\
  <label>Message (optionnel)</label><textarea name="message" rows="3" placeholder="Contexte, besoins…"></textarea>\
  <div class="vnp-actions"><button class="btn" data-cancel>Fermer</button><button type="submit" class="btn">Activer</button></div>\
</form></div>';
    document.body.appendChild(m);
    m.addEventListener('click',e=>{ if(e.target===m) m.classList.remove('open'); });
    m.querySelector('[data-cancel]').addEventListener('click',e=>{ e.preventDefault(); m.classList.remove('open'); });
    const form=m.querySelector('form');
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      if(!EP){ vnpToast("Endpoint VNP manquant."); return; }
      const fd=new FormData(form);
      const phone=(fd.get('phone')||'').toString().trim();
      if(!/^\+?\d{8,15}$/.test(phone)){ vnpToast('Téléphone invalide.'); return; }
      const payload={
        phone, platform:(fd.get('platform')||'').toString(),
        email:(fd.get('email')||'').toString().trim(),
        message:(fd.get('message')||'').toString().trim(),
        page:location.href, t:new Date().toISOString()
      };
      const btn=form.querySelector('[type="submit"]'); btn.classList.add('is-busy');
      try{
        const headers={'Content-Type':'application/json','Accept':'application/json'};
        if(window.VNP_KEY) headers['x-vnp-key']=window.VNP_KEY;
        const r=await fetch(EP+'/v1/vnp/activate',{method:'POST', headers, body:JSON.stringify(payload)});
        if(r.ok){ vnpToast('Demande envoyée.'); form.reset(); m.classList.remove('open'); }
        else{ vnpToast("Échec d'envoi."); }
      }catch(_){ vnpToast('Réseau indisponible.'); }
      btn.classList.remove('is-busy');
    });
    return m;
  }
  function open(){ ensureModal().classList.add('open'); }

  // CTA flottant
  if(matchMedia('(max-width:720px)').matches){
    if(!document.querySelector('.vnp-card')){
      const fab=document.createElement('div'); fab.className='vnp-card';
      const cta=document.createElement('a'); cta.href='#vnp'; cta.className='btn js-vnp-open'; cta.textContent='Activer le bouclier';
      fab.appendChild(cta); document.body.appendChild(fab); document.body.classList.add('has-vnp');
      cta.addEventListener('click',e=>{ e.preventDefault(); open(); });
    }
  }
  document.querySelectorAll('a[href="#vnp"],[data-vnp],.js-vnp-open').forEach(el=>el.addEventListener('click',e=>{ e.preventDefault(); open(); }));
})();
JS
   fi; }
inject_endpoint(){   local EP="${1:-}"; local KEY="${2:-}";   [[ -z "$EP" ]] && die "Usage: $0 inject <worker-url> [ajax-key]";   say "Injection endpoint → $EP"
  for f in "$ROOT"/*.html; do     sed -i -E 's/window\.VNP_ENDPOINT\s*=\s*".*?";//g' "$f";     sed -i -E 's/<script id="vnp-endpoint"[^>]*>[^<]*<\/script>//g' "$f";     if grep -qi "</body>" "$f"; then       if [[ -n "$KEY" ]]; then         sed -i -E "s#</body>#<script id=\"vnp-endpoint\">window.VNP_ENDPOINT=\"$EP\";window.VNP_KEY=\"$KEY\";</script>\n</body>#g" "$f";       else         sed -i -E "s#</body>#<script id=\"vnp-endpoint\">window.VNP_ENDPOINT=\"$EP\";</script>\n</body>#g" "$f";       fi;     fi;   done
  for f in "$ROOT"/*.html; do     sed -i -E "s|(style\.css)(\?v=[0-9]+)?|\1?v=$TS|g; s|(app\.js)(\?v=[0-9]+)?|\1?v=$TS|g" "$f";   done;   say "Endpoint injecté. (cache-bust=$TS)"; }
git_commit_push(){   if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then     git add "$ROOT"/*.html "$CSS" 2>/dev/null || true;     [[ -f "$JS" ]] && git add "$JS" || true;     git commit -m "vnp: ui+endpoint (${TODAY}) + cache-bust $TS" || true;     if git config remote.origin.url >/dev/null 2>&1; then       git push -u origin "$(git rev-parse --abbrev-ref HEAD)" || warn "Push non bloquant.";     fi;   fi; }
verify_pages(){   local SITE="${1:-https://sentinel-fusion.pages.dev}";   say "Vérif des pages (1 = OK sur chaque ligne)…";   local PAGES=(index presentation modules comparatif editions docs entreprises secteur-public defense);   for p in "${PAGES[@]}"; do     echo -n "$p -> ";     curl -fsS "$SITE/${p}.html" | grep -ci 'id="vnp-endpoint"' || true;   done; }
api_test(){   local EP="${1:-}"; local KEY="${2:-}";   [[ -z "$EP" ]] && die "Usage: $0 api-test <worker-url> [ajax-key]";   say "Tir de test API…";   if [[ -n "$KEY" ]]; then     curl -fsS "$EP/v1/vnp/activate" -H 'Accept: application/json' -H 'Content-Type: application/json' -H "x-vnp-key: $KEY"       -X POST -d '{"phone":"+33600000000","platform":"Android","message":"Ping VNP (prod)"}';   else     curl -fsS "$EP/v1/vnp/activate" -H 'Accept: application/json' -H 'Content-Type: application/json'       -X POST -d '{"phone":"+33600000000","platform":"Android","message":"Ping VNP (prod)"}';   fi;   echo; }
# ========= 2) Worker Cloudflare =========
write_worker(){   mkdir -p worker/src
  cat >worker/wrangler.toml <<TOML
name = "$NAME"
main = "src/index.js"
compatibility_date = "$(date +%Y-%m-%d)"
TOML

  cat >worker/src/index.js <<'JS'
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "access-control-allow-origin":"*",
      "access-control-allow-headers":"*",
      "access-control-allow-methods":"GET,POST,OPTIONS"
    };
    if (request.method === "OPTIONS") return new Response("",{status:204,headers:cors});
    if (url.pathname === "/v1/vnp/activate" && request.method === "POST") {
      const key = request.headers.get("x-vnp-key") || url.searchParams.get("key") || "";
      if (env.VNP_PROVISION_KEY && key !== env.VNP_PROVISION_KEY) {
        return new Response(JSON.stringify({ok:false,error:"unauthorized"}),{status:401,headers:{...cors,"content-type":"application/json"}});
      }
      const payload = await request.json().catch(()=> ({}));
      let ok=true, status=200, data={};
      if (env.VNP_PROVISION_WEBHOOK) {
        try{
          const r = await fetch(env.VNP_PROVISION_WEBHOOK, {
            method:"POST",
            headers:{"content-type":"application/json","x-vnp-key":env.VNP_PROVISION_KEY||""},
            body: JSON.stringify(payload)
          });
          ok = r.ok; status = r.status;
          data = await r.json().catch(()=> ({}));
        }catch(e){ ok=false; status=502; data={error:String(e)}; }
      }
      return new Response(JSON.stringify({ok,status,data}), {status: ok?200:status, headers:{...cors,"content-type":"application/json"}});
    }
    return new Response("ok",{headers:cors});
  }
}
JS
 }
deploy_worker(){   need node; need npm;   if ! command -v wrangler >/dev/null 2>&1; then     npm i -g wrangler;   fi;   [[ -n "${VNP_PROVISION_WEBHOOK:-}" ]] && wrangler -c worker/wrangler.toml secret put VNP_PROVISION_WEBHOOK --text "$VNP_PROVISION_WEBHOOK" || true;   [[ -n "${VNP_PROVISION_KEY:-}"     ]] && wrangler -c worker/wrangler.toml secret put VNP_PROVISION_KEY     --text "$VNP_PROVISION_KEY"     || true;   wrangler -c worker/wrangler.toml deploy; }
# ========= 3) Serveur (webhook) =========
write_server(){   rm -rf server && mkdir -p server
  cat >server/package.json <<'JSON'
{
  "name": "vnpd",
  "private": true,
  "type": "module",
  "dependencies": { "express": "^4.19.2", "cors": "^2.8.5" }
}
JSON

  cat >server/index.js <<'JS'
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8787;
const HOOK_KEY = process.env.HOOK_KEY || "";

app.use(cors());
app.use(express.json({limit:'256kb'}));

app.post('/hook/vnp', (req,res)=>{
  const k = req.header('x-vnp-key') || "";
  if (HOOK_KEY && k !== HOOK_KEY) return res.status(401).json({ok:false,error:'unauthorized'});
  const p = req.body||{};
  console.log('[VNP Hook] ', new Date().toISOString(), p);
  // TODO: intégrer ici l'auto-provision WireGuard (wg set …) si souhaité.
  return res.json({ok:true});
});

app.get('/', (_,res)=>res.json({ok:true,name:'vnpd',time:new Date().toISOString()}));
app.listen(PORT, ()=> console.log('vnpd listening on', PORT));
JS

  cat >server/install.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
need(){ command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1" >&2; exit 1; }; }
need sudo

cd "$(dirname "$0")"
sudo apt-get update -y
sudo apt-get install -y nodejs npm
npm install

SVC=/etc/systemd/system/vnpd.service
sudo bash -c "cat >$SVC" <<UNIT
[Unit]
Description=VNP Provision Hook
After=network-online.target
[Service]
WorkingDirectory=$(pwd)
Environment=PORT=8787
Environment=HOOK_KEY=${HOOK_KEY:-}
ExecStart=$(command -v node) index.js
Restart=on-failure
[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now vnpd
echo "OK: vnpd actif (port 8787)."
BASH
   chmod +x server/install.sh; }
server_install_hint(){   warn "➡️ À exécuter **sur le VPS** (pas ici) :"
  cat <<'TIPS'
scp -r server/ <user>@<IP_VPS>:/tmp/vnpd
ssh <user>@<IP_VPS> 'cd /tmp/vnpd && sudo HOOK_KEY=TaCleUltraSecrete ./install.sh'
# Vérif:
curl -s http://<IP_VPS>:8787/
TIPS
 }
# ========= 4) Orchestration =========
init_all(){ write_ui; write_worker; write_server; say "OK: fichiers générés."; }
deploy_all(){ deploy_worker; }
inject_all(){ inject_endpoint "$@"; git_commit_push; }
full_all(){   local EP="${1:-}"; local KEY="${2:-}";   init_all;   [[ -n "${VNP_PROVISION_WEBHOOK:-}" ]] && [[ -n "${VNP_PROVISION_KEY:-}" ]] || warn "Conseil: export VNP_PROVISION_WEBHOOK & VNP_PROVISION_KEY avant le deploy.";   deploy_all;   say "👉 Copie/installe le serveur maintenant (voir instructions).";   inject_all "$EP" "${KEY:-}";   sleep 35;   verify_pages "https://sentinel-fusion.pages.dev";   [[ -n "$EP" ]] && api_test "$EP" "${KEY:-}"; }
# ========= CLI =========
CMD="${1:-}"
case "$CMD" in   init)            init_all ;;   deploy)          deploy_all ;;   inject)          shift; inject_all "$@" ;;   api-test)        shift; api_test "$@" ;;   verify)          verify_pages "https://sentinel-fusion.pages.dev" ;;   server)          write_server; server_install_hint ;;   full)            shift; full_all "$@" ;;
  *) cat <<'USAGE'
Usage:
  scripts/vnp_all_pack.sh init                 # 1) Génère UI + Worker + dossier server/
  scripts/vnp_all_pack.sh deploy               # 2) Déploie le Worker (Wrangler)
  scripts/vnp_all_pack.sh inject <worker-url> [ajax-key]  # 1) + cache-bust + commit/push
  scripts/vnp_all_pack.sh server               # 3) Affiche les commandes d'installation VPS
  scripts/vnp_all_pack.sh api-test <worker-url> [ajax-key] # 4) Test API
  scripts/vnp_all_pack.sh verify               # Vérifie l'injection sur les pages
  scripts/vnp_all_pack.sh full <worker-url> [ajax-key]     # 1→4 enchaînés (sauf install VPS)
USAGE
   ;; esac
# A) Prépare Worker (Termux)
export VNP_PROVISION_WEBHOOK="http://<IP_VPS>:8787/hook/vnp"
export VNP_PROVISION_KEY="TaCleUltraSecrete"
chmod +x scripts/vnp_all_pack.sh
# B) Tout faire côté dev : UI + Worker + injection + tests
scripts/vnp_all_pack.sh full https://<ton-worker>.workers.dev TaCleUltraSecrete
scripts/vnp_all_pack.sh deploy
# Regarde la ligne "Published … (url: https://<worker-name>.<ton-sous-domaine>.workers.dev)"
# ==== 0) Prérequis Termux (une seule fois) ====
pkg update -y
pkg install -y nodejs git
mkdir -p scripts
cat > scripts/vnp_all_pack.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

ROOT=sentinel_app/public
CSS="$ROOT/style.css"
JS="$ROOT/app.js"
ts(){ date +%s; }

msg(){ printf '\n\033[1;32m%s\033[0m\n' "$*"; }
warn(){ printf '\n\033[1;33m%s\033[0m\n' "$*"; }
die(){ printf '\n\033[1;31m%s\033[0m\n' "$*"; exit 1; }

cache_bust(){
  local v; v="$(ts)"
  for f in "$ROOT"/*.html; do
    sed -i -E "s#(style\.css)(\?v=[0-9]+)?#\1?v=$v#g; s#(app\.js)(\?v=[0-9]+)?#\1?v=$v#g" "$f"
  done
}

commit_push(){
  local m="${1:-vnp: update}"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git add "$ROOT"/*.html 2>/dev/null || true
    [[ -f "$CSS" ]] && git add "$CSS" || true
    [[ -f "$JS"  ]] && git add "$JS"  || true
    git commit -m "$m" || true
    if git config remote.origin.url >/dev/null; then
      git push -u origin "$(git rev-parse --abbrev-ref HEAD)" || true
    fi
  fi
}

write_ui(){
  # CSS
  if ! grep -q "/* == vnp:css v1 == */" "$CSS" 2>/dev/null; then
cat >> "$CSS" <<'CSS'
/* == vnp:css v1 == */
.vnp-toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) scale(.95);background:rgba(10,14,20,.9);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 14px;opacity:0;pointer-events:none;transition:transform .25s,opacity .25s;z-index:9999}
.vnp-toast.show{transform:translateX(-50%) scale(1);opacity:1}
.vnp-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(8,10,14,.5);backdrop-filter:saturate(120%) blur(6px);z-index:9998}
.vnp-modal.open{display:flex}
.vnp-card{width:min(420px,92vw);background:#0f1217;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px}
.vnp-card h3{margin:0 0 8px}
.vnp-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
.vnp-actions .btn{padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#1b2130}
.vnp-fab{position:fixed;right:16px;bottom:16px;z-index:9983;display:none}
.has-vnp .vnp-fab{display:block}
.vnp-input{width:100%;margin:8px 0;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#0b0f15;color:#fff}
CSS
  fi

  # JS
  if ! grep -q "// == vnp:ui v1 ==" "$JS" 2>/dev/null; then
cat >> "$JS" <<'JS'
// == vnp:ui v1 ==
(function(){
  const EP = window.VNP_ENDPOINT || window.CONTACT_ENDPOINT || '';
  const KEY = window.VNP_KEY || '';

  function vnpToast(msg){
    let t=document.querySelector('.vnp-toast');
    if(!t){ t=document.createElement('div'); t.className='vnp-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show');
    clearTimeout(window.__vnpT); window.__vnpT=setTimeout(()=>t.classList.remove('show'),2400);
  }

  function ensureModal(){
    let m=document.querySelector('.vnp-modal'); if(m) return m;
    m=document.createElement('div'); m.className='vnp-modal';
    m.innerHTML='<div class="vnp-card"><h3>Bouclier mobile — activation</h3>\
      <form class="vnp-form" novalidate>\
        <label>Téléphone<br><input class="vnp-input" type="tel" name="phone" required placeholder="+33…"></label>\
        <label>Plateforme<br><select class="vnp-input" name="platform"><option>Android</option><option>iOS</option><option>Linux</option><option>macOS</option><option>Windows</option></select></label>\
        <label>E-mail (optionnel)<br><input class="vnp-input" type="email" name="email" placeholder="vous@example.fr"></label>\
        <label>Message (optionnel)<br><textarea class="vnp-input" name="message" rows="3" placeholder="Contexte, besoins…"></textarea></label>\
        <div class="vnp-actions"><button type="button" data-cancel class="btn">Fermer</button><button type="submit" class="btn">Activer</button></div>\
      </form></div>';
    document.body.appendChild(m);
    m.addEventListener('click', (e)=>{ if(e.target===m||e.target.hasAttribute('data-cancel')) m.classList.remove('open'); });
    const form=m.querySelector('form');
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      if(!EP){ vnpToast('Endpoint VNP manquant.'); return; }
      const fd=new FormData(form);
      const payload={
        phone:(fd.get('phone')||'').toString().trim(),
        platform:(fd.get('platform')||'').toString(),
        email:(fd.get('email')||'').toString().trim(),
        message:(fd.get('message')||'').toString().trim(),
        page:location.href, t:new Date().toISOString()
      };
      if(!/^\+?[0-9]{7,15}$/.test(payload.phone)){ vnpToast('Téléphone invalide.'); return; }
      const btn=form.querySelector('[type="submit"]'); btn.classList.add('is-busy');
      try{
        const headers={'Content-Type':'application/json','Accept':'application/json'};
        if(KEY) headers['X-VNP-Key']=KEY;
        const r=await fetch(EP,{method:'POST',headers,body:JSON.stringify(payload)});
        if(r.ok){ vnpToast('Demande envoyée.'); form.reset(); m.classList.remove('open'); }
        else{ vnpToast('Échec envoi.'); }
      }catch{ vnpToast('Réseau indisponible.'); }
      btn.classList.remove('is-busy');
    });
    return m;
  }

  function open(){ ensureModal().classList.add('open'); }

  document.querySelectorAll('a[href="#vnp"],[data-vnp],.js-vnp-open')
    .forEach(el=>el.addEventListener('click',e=>{ e.preventDefault(); open(); }));

  if(matchMedia('(max-width:720px)').matches){
    const fab=document.createElement('div'); fab.className='vnp-fab';
    const a=document.createElement('a'); a.href='#vnp'; a.className='btn js-vnp-open'; a.textContent='Activer le bouclier';
    fab.appendChild(a); document.body.appendChild(fab); document.body.classList.add('has-vnp');
  }
})();
JS
  fi
}

inject_all(){
  local EP="${1:-}"; local KEY="${2:-}"
  [[ -z "$EP" ]] && die "Usage: $0 inject <worker-url> [ajax-key]"

  # nettoyer anciens formats/injections
  for f in "$ROOT"/*.html; do
    sed -i -E 's/window\.VNP_ENDPOINTS?\s*=\s*".*?";?//g' "$f"
    sed -i -E 's#<script id="vnp-endpoint"[^<]*</script>##g' "$f"
    # insérer juste avant </body>
    local blk; blk="<script id=\"vnp-endpoint\">window.VNP_ENDPOINT=\"$EP\";$( [[ -n "$KEY" ]] && echo "window.VNP_KEY=\"$KEY\";" )</script>"
    sed -i -E "s#</body>#$blk</body>#gi" "$f"
  done
  cache_bust
  commit_push "vnp: inject $EP $( [[ -n "$KEY" ]] && echo '+ key' ) + cache-bust v$(ts)"
  msg "Endpoint injecté → $EP"
}

deploy_all(){
  if command -v wrangler >/dev/null 2>&1; then
    wrangler publish || warn "wrangler publish a échoué (login ?)."
  else
    warn "wrangler non trouvé : déploiement Worker sauté."
  fi
}

verify_pages(){
  local SITE="${1:-https://sentinel-fusion.pages.dev}"
  local PAGES=(index presentation modules comparatif editions docs entreprises secteur-public defense)
  for p in "${PAGES[@]}"; do
    local c; c=$(curl -s "$SITE/${p}.html" | grep -ci 'id="vnp-endpoint"')
    echo "$p -> $c"
  done
}

api_test(){
  local EP="${1:-}"; local KEY="${2:-}"
  [[ -z "$EP" ]] && die "Usage: $0 api-test <worker-url> [ajax-key]"
  if [[ -n "${KEY:-}" ]]; then
    curl -s "$EP" -H 'Accept: application/json' -H "X-VNP-Key: $KEY" \
      -X POST -d 'phone=+33600000000&platform=Android&message=Ping VNP (prod)'
  else
    curl -s "$EP" -H 'Accept: application/json' \
      -X POST -d 'phone=+33600000000&platform=Android&message=Ping VNP (prod)'
  fi
  echo
}

write_worker(){
  mkdir -p worker
  cat > worker/wrangler.toml <<'TOML'
name = "sentinel-vnp"
main = "src/index.js"
compatibility_date = "2024-05-29"
routes = []
TOML
  mkdir -p worker/src
  cat > worker/src/index.js <<'WJS'
export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const key = req.headers.get('x-vnp-key') || '';
    if (env.AJAX_KEY && key !== env.AJAX_KEY) return new Response(JSON.stringify({ ok:false, error:'unauthorized' }), { status: 401, headers:{'content-type':'application/json'}});
    let data={}; try{ data = await req.json(); }catch{ return new Response(JSON.stringify({ ok:false, error:'bad_json' }), { status: 400, headers:{'content-type':'application/json'}}); }
    // TODO: pousser vers webhook serveur si besoin (env.PROVISION_WEBHOOK)
    return new Response(JSON.stringify({ ok:true, received:data }), { headers:{'content-type':'application/json'}});
  }
}
WJS
  msg "Worker prêt dans ./worker (wrangler publish utilisera ce dossier)."
}

write_server(){
  mkdir -p server
  cat > server/install.sh <<'SVR'
#!/usr/bin/env bash
set -euo pipefail
HOOK_KEY="${HOOK_KEY:-changeme}"
apt update -y
apt install -y nodejs npm sqlite3 curl qrencode
cd "$(dirname "$0")"
cat > index.js <<JS
const express=require('express');
const app=express();
const PORT=process.env.PORT||8787;
const HOOK_KEY=process.env.HOOK_KEY||'changeme';
app.use(express.json());
app.post('/hook/vnp',(req,res)=>{
  if((req.headers['x-hook-key']||'')!==HOOK_KEY) return res.status(401).json({ok:false,error:'unauthorized'});
  console.log('[VNP] payload:', req.body);
  return res.json({ok:true});
});
app.listen(PORT,()=>console.log('VNP webhook on',PORT));
JS
npm -s init -y >/dev/null
npm -s i express >/dev/null
env HOOK_KEY="$HOOK_KEY" node index.js &
echo "Serveur webhook démarré (port 8787)."
SVR
  chmod +x server/install.sh
  msg "Dossier server/ généré (lancer server/install.sh sur le VPS)."
}

init_all(){ write_worker; write_ui; write_server; msg "OK: fichiers générés." ; }

deploy_only(){ ( cd worker && wrangler publish ) || true; }

inject_all_cmd(){ inject_all "${1:-}" "${2:-}"; }

full_all(){
  local EP="${1:-}"; local KEY="${2:-}"
  [[ -z "$EP" ]] && die "Usage: $0 full <worker-url> [ajax-key]"
  init_all
  deploy_all
  inject_all "$EP" "$KEY"
  verify_pages "https://sentinel-fusion.pages.dev"
  api_test "$EP" "$KEY" || true
}

usage(){
cat <<USAGE
Usage:
  $0 init                         # 1) Génère UI + Worker + serveur/
  $0 deploy                       # 2) Déploie le Worker (Wrangler)
  $0 inject <worker-url> [key]    # 3) Injection + cache-bust + commit/push
  $0 api-test <worker-url> [key]  # 4) Test API
  $0 verify                       # Vérifie l'injection sur les pages
  $0 full <worker-url> [key]      # 1→4 enchaînés (sauf install VPS)
  $0 server                       # Affiche le mémo d'installation VPS
USAGE
}

server_hint(){
cat <<'HINT'
==== Pack SERVEUR ====
1) Copier sur le VPS :
   scp -r server/ user@IP_VPS:/tmp/vnpd
2) Installer :
   ssh user@IP_VPS 'cd /tmp/vnpd && sudo HOOK_KEY="TaCleUltraSecrete" ./install.sh'
3) (Pare-feu si besoin) :
   sudo ufw allow 8787/tcp
4) Dans le Worker, tu peux pointer env.PROVISION_WEBHOOK sur http://IP_VPS:8787/hook/vnp
   et émettre depuis le Worker avec l'en-tête:  'X-Hook-Key: TaCleUltraSecrete'
======================
HINT
}

case "${1:-}" in
  init)        init_all ;;
  deploy)      deploy_all ;;
  inject)      shift; inject_all_cmd "$@" ;;
  api-test)    shift; api_test "$@" ;;
  verify)      verify_pages "https://sentinel-fusion.pages.dev" ;;
  server)      server_hint ;;
  full)        shift; full_all "$@" ;;
  *)           usage ;;
esac
BASH

chmod +x scripts/vnp_all_pack.sh
# 2 options :
# (sans clé AJAX — tu dois avoir désactivé CAPTCHA côté Forms/Worker)
scripts/vnp_all_pack.sh full https://<ton-worker>.workers.dev
# (avec clé AJAX — le Worker exigera l'en-tête X-VNP-Key)
scripts/vnp_all_pack.sh full https://<ton-worker>.workers.dev TaCleUltraSecrete
# sur ta machine dev
scripts/vnp_all_pack.sh server   # affiche le mémo
# puis :
scp -r server/ user@IP_VPS:/tmp/vnpd
ssh user@IP_VPS 'cd /tmp/vnpd && sudo HOOK_KEY="TaCleUltraSecrete" ./install.sh'
# (ouvre le port si UFW)  sudo ufw allow 8787/tcp
