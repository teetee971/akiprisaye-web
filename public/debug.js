(function(){
  console.log("[debug] script chargé");
  // Hook du bouton si jamais
  document.addEventListener("DOMContentLoaded", function(){
    var b = document.getElementById("go");
    if(b){
      console.log("[debug] bouton #go présent");
      b.addEventListener("click", function(){
        console.log("[debug] click #go (DOM listener)");
      }, {once:false});
    } else {
      console.warn("[debug] bouton #go introuvable");
    }
  });

  // Monkey-patch de fetch pour log l’URL appelée
  if(window.fetch){
    const _f = window.fetch;
    window.fetch = function(u, opt){
      try{ console.log("[debug] fetch =>", (u && u.toString ? u.toString() : u), opt||{}); }catch(e){}
      return _f.apply(this, arguments);
    };
  }
})();
