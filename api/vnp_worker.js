export default { async fetch(req, env){ if(req.method==='OPTIONS')return C(env); if(req.method!=='POST')return J({error:'Method not allowed'},405,env);
 const need=!!env.X_VNP_KEY, key=req.headers.get('x-vnp-key')||''; if(need&&key!==env.X_VNP_KEY)return J({error:'Unauthorized'},401,env);
 const ip=req.headers.get('cf-connecting-ip')||'0.0.0.0', ua=req.headers.get('user-agent')||''; if(!(await RL(env,ip)))return J({error:'Too Many Requests'},429,env);
 let p; try{p=await req.json()}catch{return J({error:'Bad JSON'},400,env)}; if((p.hp||p._gotcha||'').toString().trim()) return J({ok:true,skipped:true},200,env);
 const u=new URL(req.url); if(u.pathname.endsWith('/v1/vnp/activate'))return A(p,{ip,ua},env); if(u.pathname.endsWith('/v1/vnp/provision'))return P(p,{ip,ua},env); return J({error:'Not found'},404,env);} };
async function A(p,m,env){ const phone=(p.phone||'').toString().trim(); if(!phone||phone.length<6)return J({error:'Téléphone invalide'},400,env);
 const id=crypto.randomUUID(); await env.DB.prepare(`INSERT INTO activations(id,kind,phone,platform,email,message,page,ip,ua,created_at) VALUES(?,'vnp',?,?,?,?,?,?,?,datetime('now'))`).bind(id,(p.phone||'').toString(),(p.platform||'').toString(),(p.email||'').toString(),(p.message||'').toString(),(p.page||'').toString(),m.ip,m.ua).run();
 try{ await fetch('https://api.mailchannels.net/tx/v1/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({personalizations:[{to:[{email:env.MAIL_TO}]}],from:{email:env.MAIL_FROM,name:'Sentinel Fusion'},subject:`[VNP] Demande ${phone} (${(p.platform||'')||'N/A'})`,content:[{type:'text/plain',value:`Demande VNP\nTéléphone : ${phone}\nPlateforme : ${p.platform||'-'}\nEmail : ${p.email||'-'}\nMessage : ${p.message||'-'}\nPage : ${p.page||'-'}\nIP/UA : ${m.ip} | ${m.ua}\nID : ${id}\n`}]})}); }catch(e){}
 return J({ok:true,id},200,env); }
async function P(p,m,env){ const email=(p.email||'').toString().trim(); const label=(p.label||'device').toString().trim(); const priv=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))), pub=priv; const ip4=p.requestedIp||`10.8.0.${Math.floor(10+Math.random()*200)}`; const token=crypto.randomUUID();
 await env.DB.prepare(`INSERT INTO devices(token,label,email,client_priv,client_pub,ip4,created_at) VALUES(?,?,?,?,?, ?, datetime('now'))`).bind(token,label,email,priv,pub,ip4).run();
 if(env.PROVISION_WEBHOOK){ try{ await fetch(env.PROVISION_WEBHOOK,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,label,email,clientPub:pub,ip4})}); }catch(e){} }
 const conf=`[Interface]\nPrivateKey = ${priv}\nAddress = ${ip4}/32\nDNS = ${env.WG_DNS||'1.1.1.1'}\n\n[Peer]\nPublicKey = ${env.WG_SERVER_PUBKEY||'<SERVER_PUBKEY>'}\nAllowedIPs = ${env.WG_ALLOWED_IPS||'0.0.0
mkdir -p scripts sentinel_app/public api db server

cat > scripts/vnp_all_pack.sh <<'BASH'
#!/usr/bin/env bash
# Sentinel Fusion — VNP all-in-one pack
# Usage: scripts/vnp_all_pack.sh {init|deploy|inject <endpoint> [key]|full <endpoint> [key]|server|server-install}
set -euo pipefail
CMD="${1:-}"; EP="${2:-}"; KEY="${3:-}"; ROOT="sentinel_app/public"; mkdir -p "$ROOT" scripts api db server

write_worker(){ cat > api/vnp_worker.js <<'JS'
export default {
  async fetch(req, env){
    if(req.method==='OPTIONS')return cors(env);
    if(req.method!=='POST')return json({error:'Method not allowed'},405,env);
    const need=!!env.X_VNP_KEY, key=req.headers.get('x-vnp-key')||'';
    if(need&&key!==env.X_VNP_KEY) return json({error:'Unauthorized'},401,env);
    if(!(await rate(env, req.headers.get('cf-connecting-ip')||'0.0.0.0'))) return json({error:'Too Many Requests'},429,env);
    let p; try{p=await req.json()}catch(_){return json({error:'Bad JSON'},400,env)}
    if((p.hp||p._gotcha||'').toString().trim()) return json({ok:true,skipped:true},200,env); // honeypot
    const u=new URL(req.url);
    if(u.pathname.endsWith('/v1/vnp/activate')) return activate(p,req,env);
    if(u.pathname.endsWith('/v1/vnp/provision')) return provision(p,env);
    return json({error:'Not found'},404,env);
  }
};
async function activate(p,req,env){
  const phone=(p.phone||'').toString().trim(); if(!phone||phone.length<6) return json({error:'Téléphone invalide'},400,env);
  const id=crypto.randomUUID(); const ip=req.headers.get('cf-connecting-ip')||'0.0.0.0', ua=req.headers.get('user-agent')||'';
  await env.DB.prepare(`INSERT INTO activations(id,kind,phone,platform,email,message,page,ip,ua,created_at)
    VALUES(?,'vnp',?,?,?,?,?,?,?,datetime('now'))`).bind(id,(p.phone||'').toString(),(p.platform||'').toString(),
      (p.email||'').toString(),(p.message||'').toString(),(p.page||'').toString(),ip,ua).run();
  try{ await fetch('https://api.mailchannels.net/tx/v1/send',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({personalizations:[{to:[{email:env.MAIL_TO}]}],from:{email:env.MAIL_FROM,name:'Sentinel Fusion'},
      subject:`[VNP] Demande ${phone} (${(p.platform||'')||'N/A'})`,
      content:[{type:'text/plain',value:`Demande VNP\nTéléphone : ${phone}\nPlateforme : ${p.platform||'-'}\nEmail : ${p.email||'-'}\nMessage : ${p.message||'-'}\nPage : ${p.page||'-'}\nIP/UA : ${ip} | ${ua}\nID : ${id}\n`}]})}); }catch(e){}
  return json({ok:true,id},200,env);
}
async function provision(p,env){
  const email=(p.email||'').toString().trim(); const label=(p.label||'device').toString().trim();
  const priv=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))); const pub=priv; // (dummy) remplace par vraie dérivation si besoin
  const ip4=p.requestedIp||`10.8.0.${Math.floor(10+Math.random()*200)}`; const token=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO devices(token,label,email,client_priv,client_pub,ip4,created_at)
    VALUES(?,?,?,?,?, ?, datetime('now'))`).bind(token,label,email,priv,pub,ip4).run();
  if(env.PROVISION_WEBHOOK){
    try{
      const h={'content-type':'application/json'}; if(env.PROVISION_KEY) h['x-hook-key']=env.PROVISION_KEY;
      await fetch(env.PROVISION_WEBHOOK,{method:'POST',headers:h,body:JSON.stringify({token,label,email,clientPub:pub,ip4})});
    }catch(e){}
  }
  const conf=`[Interface]\nPrivateKey = ${priv}\nAddress = ${ip4}/32\nDNS = ${env.WG_DNS||'1.1.1.1'}\n\n[Peer]\nPublicKey = ${env.WG_SERVER_PUBKEY||'<SERVER_PUBKEY>'}\nAllowedIPs = ${env.WG_ALLOWED_IPS||'0.0.0.0/0, ::/0'}\nEndpoint = ${env.WG_ENDPOINT||'vpn.example.com:51820'}\nPersistentKeepalive = 25\n`;
  return json({ok:true,token,conf},200,env);
}
function json(o,s,e){return new Response(JSON.stringify(o),{status:s,headers:{...corsH(e),'content-type':'application/json'}})}
function corsH(e){const o=e.CORS_ORIGIN||'*'; return {'access-control-allow-origin':o,'access-control-allow-headers':'content-type,x-vnp-key','access-control-allow-methods':'POST,OPTIONS'} }
function cors(e){return new Response('',{status:204,headers:corsH(e)})}
async function rate(env,ip){ if(!env.RL) return true; const k=`rl:${ip}`, now=Date.now(); const last=parseInt(await env.RL.get(k)||'0',10); if(now-last<60000) return false; await env.RL.put(k,String(now),{expirationTtl:120}); return true; }
