type Props = {
  values: Record<string, number>;
};

export default function DomMapSvg({ values }: Props) {
  return (
    <svg viewBox="0 0 400 260" className="w-full max-w-xl mx-auto">
      {region(80, 120, values.guadeloupe, 'Guadeloupe')}
      {region(160, 120, values.martinique, 'Martinique')}
      {region(240, 90, values.guyane, 'Guyane')}
      {region(320, 160, values.reunion, 'Réunion')}
    </svg>
  );
}

function region(x: number, y: number, index = 0, label: string) {
  return (
    <g>
      <circle cx={x} cy={y} r={28} fill={color(index)} />
      <text
        x={x}
        y={y + 45}
        textAnchor="middle"
        fontSize="10"
        fill="#fff"
      >
        {label}
      </text>
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="#000"
      >
        {index.toFixed(1)}
      </text>
    </g>
  );
}

function color(index: number) {
  if (index < 110) return '#22c55e';
  if (index < 120) return '#eab308';
  if (index < 130) return '#f97316';
  return '#ef4444';
}