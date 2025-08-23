#!/usr/bin/env bash
set -euo pipefail; EP="${1:-}"; KEY="${2:-}"; ROOT="sentinel_app/public"; CSS="$ROOT/style.css"; JS="$ROOT/app.js"; ts=$(date +%s)
[[ -z "$EP" ]] && { echo "Usage: $0 <endpoint-url> [ajax_key]"; exit 1; }
grep -q "/* == vnp:ui v1 == */" "$CSS" 2>/dev/null || cat >> "$CSS" <<'CSS'
/* == vnp:ui v1 == */ .vnp-fab{position:fixed;right:16px;bottom:16px;z-index:998;display:none}.has-vnp .vnp-fab{display:block}.vnp-card{padding:14px}
.vnp-toast{position:fixed;left:50%;bottom:16px;transform:translate(-50%,120%);opacity:0;transition:transform .25s ease,opacity .25s;background:rgba(10,14,20,.9);color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 14px;backdrop-filter:saturate(120%) blur(8px);z-index:999}
.vnp-toast.show{transform:translate(-50%,0);opacity:1}.is-busy{pointer-events:none;opacity:.6}.hp{position:absolute !important;left:-9999px !important;opacity:0 !important}
@media (max-width:720px){.vnp-card{padding:14px}}
CSS
grep -q "/* == vnp:ui v1 == */" "$JS" 2>/dev/null || cat >> "$JS" <<'JS'
/* == vnp:ui v1 == */(function(){const EP=window.VNP_ENDPOINT||'';function t(m){let d=document.querySelector('.vnp-toast');if(!d){d=document.createElement('div');d.className='vnp-toast';document.body.appendChild(d)}d.textContent=m;d.classList.add('show');clearTimeout(window._to);window._to=setTimeout(()=>d.classList.remove('show'),2600)}
function modal(){let m=document.querySelector('.vnp-modal');if(m)return m;m=document.createElement('div');m.className='vnp-modal';m.innerHTML='<div class="vnp-card"><h3>Bouclier mobile — activation</h3><form class="vnp-form" novalidate><input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px"><label>Téléphone<br><input type="tel" name="phone" required placeholder="+33..."></label><label>Plateforme<select name="platform"><option>Android</option><option>iOS</option><option>Windows</option><option>macOS</option><option>Linux</option></select></label><label>E-mail (optionnel)<br><input type="email" name="email" placeholder="vous@exemple.fr"></label><label>Message (optionnel)<br><textarea name="message" rows="3" placeholder="Contexte, besoins…"></textarea></label><div class="vnp-actions"><button type="button" data-cancel>Fermer</button><button type="submit" class="btn">Activer</button></div></form></div>';
document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});m.querySelector('[data-cancel]').addEventListener('click',()=>m.classList.remove('open'));
const f=m.querySelector('form');f.addEventListener('submit',async ev=>{ev.preventDefault();if(!EP){t('Endpoint VNP manquant.');return}const fd=new FormData(f);const phone=(fd.get('phone')||'').toString().trim();if(phone.length<6){t('Téléphone invalide.');return}
const payload={phone,platform:(fd.get('platform')||'').toString(),email:(fd.get('email')||'').toString(),message:(fd.get('message')||'').toString(),page:location.href,t:new Date().toISOString(),hp:(fd.get('_gotcha')||'').toString()};
const btn=f.querySelector('[type=\"submit\"]');btn.classList.add('is-busy');
try{const h={'Content-Type':'application/json','Accept':'application/json'};if(window.VNP_AJAX_KEY)h['x-vnp-key']=window.VNP_AJAX_KEY;
 const r=await fetch(EP+'/v1/vnp/activate',{method:'POST',headers:h,body:JSON.stringify(payload)});if(r.ok){t('Demande envoyée.');f.reset();m.classList.remove('open')}else t('Échec envoi.');}catch(e){t('Réseau indisponible.')}btn.classList.remove('is-busy')});return m}
const fab=document.createElement('div');fab.className='vnp-fab';const c=document.createElement('a');c.href='#vnp';c.className='btn js-vnp-open';c.textContent='Activer le bouclier';fab.appendChild(c);document.body.appendChild(fab);document.body.classList.add('has-vnp');
document.querySelectorAll('a[href=\"#vnp\"],[data-vnp],.js-vnp-open').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();modal().classList.add('open')}));})();
JS
for f in "$ROOT"/*.html; do sed -i -E 's|<script id="vnp-endpoint"[^<]*</script>||g' "$f"; if grep -qi '</body>' "$f"; then
  sed -i "s|</body>|<script id=\"vnp-endpoint\">window.VNP_ENDPOINT=\"${EP}\";${KEY:+window.VNP_AJAX_KEY=\"${KEY}\";}</script>\n</body>|" "$f"; fi; done
for f in "$ROOT"/*.html; do sed -i -E "s|(style\.css)(\?v=[0-9]+)?|\1?v=${ts}|g; s|(app\.js)(\?v=[0-9]+)?|\1?v=${ts}|g" "$f"; done
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git add "$ROOT"/*.html "$CSS" "$JS" 2>/dev/null || true; git commit -m "vnp: inject ${EP} ${KEY:+ +ajax-key} + cache-bust v${ts}" || true; git config remote.origin.url >/dev/null && git push -u origin "$(git rev-parse --abbrev-ref HEAD)" || true; fi
sleep 35; SITE="https://sentinel-fusion.pages.dev"; PAGES=(index presentation modules comparatif editions docs entreprises secteur-public defense)
for p in "${PAGES[@]}"; do c="$(curl -s "${SITE}/${p}.html" | grep -ci 'id=\"vnp-endpoint\"')" || true; echo "$p -> $c"; done
H=( -H "Accept: application/json" -H "Content-Type: application/json" ); [[ -n "${KEY}" ]] && H+=( -H "x-vnp-key: ${KEY}" )
curl -s "${EP}/v1/vnp/activate" "${H[@]}" -X POST -d '{"phone":"+33600000000","platform":"Android","message":"Ping VNP (prod)"}'; echo
