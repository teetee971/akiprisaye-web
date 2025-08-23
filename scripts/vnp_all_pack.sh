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
