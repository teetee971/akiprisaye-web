const http=require('http'); const {execFile}=require('child_process');
const PORT=process.env.PORT||8787; const KEY=process.env.HOOK_KEY||'';
function ok(res,o){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(o))}
function bad(res,code,msg){res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify({error:msg}))}
http.createServer((req,res)=>{
  if(req.method==='POST' && req.url==='/hook/vnp'){
    if(KEY && req.headers['x-hook-key']!==KEY) return bad(res,401,'unauthorized');
    let buf=''; req.on('data',c=>buf+=c); req.on('end',()=>{
      try{ const p=JSON.parse(buf);
        const pub=p.clientPub||p.client_pub||''; const ip=p.ip4||p.ip||'';
        if(!pub||!ip) return bad(res,400,'missing fields');
        execFile(__dirname+'/wg-provisioner.sh',[pub,ip],{env:process.env},(err,stdout,stderr)=>{
          if(err) return bad(res,500,'wg error'); ok(res,{ok:true,out:(stdout||'').trim()});
        });
      }catch(e){ return bad(res,400,'bad json'); }
    });
  } else { bad(res,404,'not found'); }
}).listen(PORT, ()=>console.log('vnpd listening on',PORT));
