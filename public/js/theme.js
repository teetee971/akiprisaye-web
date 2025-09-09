(()=>{const k="akp-theme";const root=document.documentElement;const btn=document.getElementById("theme-toggle");
function apply(mode){root.classList.toggle("light",mode==="light"); if(btn){btn.textContent=mode==="light"?"🌙 Sombre":"☀️ Clair";}}
const saved=localStorage.getItem(k)||"dark"; apply(saved);
btn&&btn.addEventListener("click",()=>{const cur=root.classList.contains("light")?"light":"dark";const next=cur==="light"?"dark":"light";localStorage.setItem(k,next);apply(next);});
})();
