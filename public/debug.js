(function(){
  let dbg = document.getElementById("dbg");
  if(!dbg){
    dbg = document.createElement("pre");
    dbg.id = "dbg";
    dbg.style.cssText = "position:fixed;bottom:0;left:0;right:0;max-height:40%;overflow:auto;background:#111;color:#8ef;font-size:12px;z-index:9999;margin:0;padding:4px;";
    document.body.appendChild(dbg);
  }

  function log(msg){
    const line = document.createElement("div");
    line.textContent = `[${new Date().toISOString()}] ${msg}`;
    dbg.appendChild(line);

    // garder seulement 200 lignes max
    while(dbg.childNodes.length > 200){
      dbg.removeChild(dbg.firstChild);
    }
  }

  window.dbg = log;
})();
