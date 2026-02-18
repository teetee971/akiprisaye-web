import { useMemo } from 'react';

type NavigateButtonsProps = {
  lat: number;
  lng: number;
  className?: string;
};

export default function NavigateButtons({ lat, lng, className }: NavigateButtonsProps) {
  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  const destination = encodeURIComponent(`${lat},${lng}`);

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Google Maps
      </a>
      <a
        href={`https://waze.com/ul?ll=${destination}&navigate=yes`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
      >
        Waze
      </a>
      {isIOS && (
        <a
          href={`https://maps.apple.com/?daddr=${destination}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-slate-600 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Apple Plans
        </a>
      )}
    </div>
  );
}
