export default function HeatmapStat({ label, value, sub, highlight }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderRadius: 'var(--r-xl)',
      background: highlight ? 'var(--primary-subtle)' : 'var(--surface)',
      border: `1.5px solid ${highlight ? 'var(--primary)' : 'var(--border)'}`,
      boxShadow: 'var(--shadow-2)',
    }}>
      <div style={{
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        color: highlight ? 'var(--primary)' : 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
