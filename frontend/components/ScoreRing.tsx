type ScoreRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  fontSize?: number;
  label?: string;
};

export function ScoreRing({
  value,
  size = 56,
  stroke = 5,
  color = '#16a34a',
  track = '#e9edf4',
  fontSize = 16,
  label,
}: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(value, 100) / 100);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-ring-value" style={{ fontSize }}>
        {label ?? value}
      </span>
    </div>
  );
}

export function fitColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 65) return '#2563eb';
  return '#ea8a1f';
}
