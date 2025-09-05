(function(){
  let box = document.getElementById("dbg");
  if(!box){
    box = document.createElement("div");
    box.id = "dbg";
    box.style.cssText = "position:fixed;top:0;left:0;max-height:50%;overflow:auto;z-index:9999;background:#111;color:#8ef;font:12px monospace;padding:4px;opacity:0.9";
    document.body.appendChild(box);
  }

  window.dbg = function(msg){
    const line = document.createElement("div");
    line.textContent = "[debug] " + msg;
    box.appendChild(line);
    console.log("[debug]", msg);
  };
})();
