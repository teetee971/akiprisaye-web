import { useEffect, useRef, useState } from 'react';
import { loadDomIndexesForMonth } from '../services/domMapTimelineService';
import DomMapSvg from './DomMapSvg';

const TIMELINE = [
  {
    month: '2025-11',
    comment:
      "Fin 2025 : les écarts de prix restent élevés dans les DOM, avec une pression marquée sur l'alimentaire importé.",
  },
  {
    month: '2025-12',
    comment:
      "Décembre 2025 : les fêtes accentuent les surcoûts, notamment en Guadeloupe et en Martinique.",
  },
  {
    month: '2026-01',
    comment:
      "Début 2026 : légère stabilisation observée, mais les prix restent structurellement plus élevés qu'en métropole.",
  },
];

export default function DomMapTimeline() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Chargement des données
  useEffect(() => {
    let alive = true;

    loadDomIndexesForMonth(TIMELINE[step].month).then((data) => {
      if (!alive) return;

      const map: Record<string, number> = {};
      data.forEach((d) => (map[d.territory] = d.index));
      setValues(map);
    });

    return () => {
      alive = false;
    };
  }, [step]);

  // Lecture automatique
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setStep((prev) => (prev + 1) % TIMELINE.length);
    }, 1800);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing]);

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          Carte du surcoût — {TIMELINE[step].month}
        </h2>

        <button
          onClick={() => setPlaying((p) => !p)}
          className="px-3 py-1 rounded-md text-sm bg-white/10 hover:bg-white/20"
        >
          {playing ? '⏸ Pause' : '▶︎ Lecture'}
        </button>
      </div>

      {/* Carte */}
      <DomMapSvg values={values} />

      {/* Commentaire synchronisé */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm leading-relaxed">
        {TIMELINE[step].comment}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={TIMELINE.length - 1}
        value={step}
        onChange={(e) => {
          setStep(Number(e.target.value));
          setPlaying(false);
        }}
        className="w-full"
      />
    </div>
  );
}