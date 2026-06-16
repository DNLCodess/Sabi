import { LifeBuoy } from 'lucide-react'

export default function CrisisBar() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderRadius: 'var(--r-lg)',
      background: '#FEE2E2',
      border: '1.5px solid var(--crisis)',
      marginBottom: 24,
    }}>
      <LifeBuoy size={24} color="var(--crisis)" strokeWidth={1.75} style={{ flexShrink: 0 }} />
      <div>
        <p style={{ fontWeight: 700, color: '#B91C1C', margin: 0, fontSize: '1rem' }}>
          You don't have to handle this alone.
        </p>
        <p style={{ color: '#991B1B', margin: '4px 0 0', fontSize: '0.875rem' }}>
          Please reach out to one of the resources below right now. Your safety matters most.
        </p>
      </div>
    </div>
  )
}
