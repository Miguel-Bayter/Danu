interface VelocityRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

/** Signature element — arc visualizing health score. No inline styles. */
export function VelocityRing({ score, size = 32, strokeWidth = 2.5 }: VelocityRingProps) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, score))
  const dashArray = `${(clamped / 100) * circumference} ${circumference}`

  // stroke color via SVG presentation attribute (not CSS inline style)
  const arcColor =
    clamped >= 75
      ? 'var(--status-success)'
      : clamped >= 50
        ? 'var(--status-warning)'
        : clamped >= 25
          ? '#f97316'
          : 'var(--status-danger)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90 shrink-0"
      aria-label={`Health score: ${clamped}/100`}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={0.12}
      />
      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={arcColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        className="velocity-ring-arc"
      />
    </svg>
  )
}
