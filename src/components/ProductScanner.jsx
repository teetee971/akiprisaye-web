import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function ProductScanner({onCode}) {
  const videoRef = useRef(null);
  const [err, setErr] = useState("");
  useEffect(()=>{
    const codeReader = new BrowserMultiFormatReader();
    let active = true;
    (async ()=>{
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
        if (!active) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const result = await codeReader.decodeOnceFromVideoElement(videoRef.current);
        if (result?.text && onCode) onCode(result.text);
      } catch(e){ setErr(e.message || "Caméra indisponible"); }
    })();
    return ()=>{ active=false; codeReader.reset(); videoRef.current?.srcObject && (videoRef.current.srcObject.getTracks().forEach(t=>t.stop())); };
  },[]);
  return (
    <div className="space-y-2">
      <video ref={videoRef} className="w-full rounded-xl border border-slate-700" muted playsInline />
      {err && <p className="text-rose-400 text-sm">⚠️ {err}</p>}
    </div>
  );
}
