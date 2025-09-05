(function(){
  // debug OFF par défaut — on n'active que si ?debug=1
  var enabled = false;
  try {
    var p = new URLSearchParams(location.search);
    enabled = (p.get('debug') === '1');
  } catch(e){ enabled = false; }

  // Même si désactivé, on expose un no-op pour éviter les erreurs.
  if(!enabled){
    window.dbg = function(){ /* no-op */ };
    return;
  }

  // Création overlay unique
  var dbg = document.getElementById("dbg");
  if(!dbg){
    dbg = document.createElement("div");
    dbg.id = "dbg";
    dbg.style.cssText = [
      "position:fixed","left:0","right:0","bottom:0","max-height:45%",
      "background:#111","color:#8ef","font:12px/1.4 monospace","z-index:999999",
      "margin:0","padding:0","box-shadow:0 -2px 10px rgba(0,0,0,.4)"
    ].join(";");
    // barre d'actions
    var bar = document.createElement("div");
    bar.style.cssText = "display:flex;gap:8px;align-items:center;padding:6px 8px;background:#222;color:#ccc;border-bottom:1px solid #333;";
    var title = document.createElement("strong");
    title.textContent = "Debug overlay";
    title.style.cssText = "margin-right:auto;color:#9cf;";
    var btnClear = document.createElement("button");
    btnClear.textContent = "Clear";
    btnClear.style.cssText = "background:#444;color:#fff;border:1px solid #555;border-radius:6px;padding:4px 8px;cursor:pointer;";
    btnClear.onclick = function(){ list.innerHTML = ""; };

    bar.appendChild(title); bar.appendChild(btnClear);

    // zone de log
    var list = document.createElement("div");
    list.id = "dbg-list";
    list.style.cssText = "padding:6px 8px;overflow:auto;max-height:calc(45vh - 36px);";

    dbg.appendChild(bar);
    dbg.appendChild(list);
    document.body.appendChild(dbg);
  }

  function log(msg){
    var list = document.getElementById("dbg-list") || dbg;
    var line = document.createElement("div");
    var stamp = new Date().toISOString();
    line.textContent = "["+stamp+"] "+msg;
    list.appendChild(line);
    // limiter à 200 lignes
    while(list.childNodes.length > 200){ list.removeChild(list.firstChild); }
    // auto-scroll
    list.scrollTop = list.scrollHeight;
  }
  window.dbg = log;

  try{ dbg("Overlay debug activé (param debug=1)"); }catch(e){}
})();
