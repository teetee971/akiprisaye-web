import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0f0c]">
      <div className="flex flex-col items-center gap-4">
        
        <div className="relative w-28 h-28 rounded-3xl">
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 50%, #00A86B 0%, transparent 65%)",
            }}
          />
          <div className="relative w-28 h-28 rounded-3xl border border-emerald-500/50 grid place-items-center">
            <span className="text-white font-extrabold text-center leading-5 tracking-wide">
              A KI <br /> PRI SA <br /> YÉ
            </span>
          </div>
        </div>

        <p className="text-white/80 text-sm">Comparez & Économisez</p>

        <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full w-1/3 animate-[sweep_1.2s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg,#00A86B,#36d399)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
