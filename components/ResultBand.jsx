const TIER_COLORS = {
  0: { ring: '#1E9E8A', bg: '#DFFBF8', text: '#1E9E8A' },
  1: { ring: '#5B8DEF', bg: '#D8E8FF', text: '#3A6CC4' },
  2: { ring: '#B7791F', bg: '#FEF3C7', text: '#92610A' },
  3: { ring: '#D9534F', bg: '#FEE2E2', text: '#B91C1C' },
  4: { ring: '#D9534F', bg: '#FEE2E2', text: '#B91C1C' },
}

export default function ResultBand({ label, score, band, weight }) {
  const tier = weight ?? 0
  const colors = TIER_COLORS[Math.min(tier, 4)]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderRadius: 'var(--r-lg)',
      border: `1.5px solid ${colors.ring}`,
      background: colors.bg,
    }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.text }}>
          {band}
        </div>
      </div>
      {score != null && (
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.ring, opacity: 0.8 }}>
          {score}
        </div>
      )}
    </div>
  )
}
