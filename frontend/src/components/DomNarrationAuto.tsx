import { useEffect, useState } from 'react';

type DeltaMap = Record<string, number>;

interface Props {
  deltas: DeltaMap;
  beforeLabel: string;
  afterLabel: string;
}

export default function DomNarrationAuto({ deltas, beforeLabel, afterLabel }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    const entries = Object.entries(deltas);

    if (entries.length === 0) {
      setText('Aucune donnée suffisante pour établir une analyse comparative.');
      return;
    }

    const hausses = entries.filter(([, v]) => v > 2);
    const baisses = entries.filter(([, v]) => v < -2);
    const stables = entries.filter(([, v]) => Math.abs(v) <= 2);

    const parts: string[] = [];

    parts.push(
      `Entre ${beforeLabel} et ${afterLabel}, l’analyse met en évidence des évolutions contrastées des prix à la consommation dans les territoires observés.`
    );

    if (hausses.length > 0) {
      parts.push(
        `Des hausses significatives sont observées dans ${hausses
          .map(([k]) => k)
          .join(', ')}, traduisant une pression accrue sur le pouvoir d’achat local.`
      );
    }

    if (baisses.length > 0) {
      parts.push(
        `À l’inverse, une baisse notable des prix est constatée dans ${baisses
          .map(([k]) => k)
          .join(', ')}, suggérant un effet de régulation ou d’ajustement des marchés.`
      );
    }

    if (stables.length > 0) {
      parts.push(
        `Dans ${stables
          .map(([k]) => k)
          .join(', ')}, les prix demeurent globalement stables sur la période étudiée.`
      );
    }

    parts.push(
      `Ces résultats soulignent l’importance d’un suivi temporel régulier afin d’anticiper les déséquilibres et d’orienter les politiques publiques de lutte contre la vie chère.`
    );

    setText(parts.join(' '));
  }, [deltas, beforeLabel, afterLabel]);

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-sm leading-relaxed">
      <h3 className="font-semibold mb-2">Analyse automatique — évolution des prix</h3>
      <p>{text}</p>
    </div>
  );
}
