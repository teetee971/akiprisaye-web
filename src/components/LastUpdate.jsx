import { useEffect, useState } from "react";

export default function LastUpdate() {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    fetch(`/version.txt?v=${Date.now()}`).then(r => r.text()).then(setTxt).catch(() => {});
  }, []);
  const m = txt.match(/commit=([0-9a-f]{6,8}).*date=([0-9T:\-Z]+)/);
  const commit = m?.[1] ?? "";
  const date = m?.[2]?.replace("T", " ").replace("Z","") ?? "";
  return <span className="text-xs text-slate-400">MAJ : {date} {commit && `(${commit})`}</span>;
}
