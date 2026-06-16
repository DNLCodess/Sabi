import { Lock, HeartHandshake, CalendarCheck, MessageCircle } from 'lucide-react'

const ICON_MAP = { Lock, HeartHandshake, CalendarCheck, MessageCircle }

export default function BarrierPanel({ items }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderRadius: 'var(--r-xl)',
      background: 'var(--primary-subtle)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(({ icon, text }) => {
          const Icon = ICON_MAP[icon]
          return (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {Icon && <Icon size={20} strokeWidth={1.75} color="var(--primary)" />}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
