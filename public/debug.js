(function(){
  let box = document.getElementById("dbg");
  if(!box){
    box = document.createElement("div");
    box.id = "dbg";
    box.style.cssText =
      "position:fixed;top:0;left:0;max-height:50%;overflow:auto;"+
      "z-index:9999;background:#111;color:#8ef;font:12px monospace;"+
      "padding:6px 6px 4px;border-bottom-right-radius:8px;opacity:0.95";
    // Header + bouton Clear
    const header = document.createElement("div");
    header.style.cssText = "display:flex;gap:8px;align-items:center;margin-bottom:4px";
    const title = document.createElement("strong");
    title.textContent = "Debug";
    title.style.cssText = "color:#9ff";
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.style.cssText =
      "background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:2px 6px";
    const body = document.createElement("div");
    body.id = "dbg-body";
    box.appendChild(header); header.appendChild(title); header.appendChild(clearBtn);
    box.appendChild(body);
    clearBtn.addEventListener("click", ()=>{ body.textContent = ""; });
    document.body.appendChild(box);
  }
  const body = box.querySelector("#dbg-body") || box;

  const MAX_LINES = 200;
  function prune(){
    while(body.childElementCount > MAX_LINES){
      body.removeChild(body.firstChild);
    }
  }

  window.dbg = function(msg){
    try{
      const line = document.createElement("div");
      const ts = new Date().toISOString().split("T")[1].replace("Z","");
      line.textContent = "["+ts+"] " + (typeof msg === "string" ? msg : JSON.stringify(msg));
      body.appendChild(line);
      prune();
    }catch(e){ /* ignore rendering errors */ }
    try{ console.log("[debug]", msg); }catch{}
  };
})();
