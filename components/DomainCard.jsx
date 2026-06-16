'use client'
import { Activity, Wind, BatteryLow, CloudRain } from 'lucide-react'

const ICONS = {
  pss10: Activity,
  gad7:  Wind,
  cbi:   BatteryLow,
  phq9:  CloudRain,
}

const DESCRIPTIONS = {
  pss10: 'Feeling overwhelmed or like things are out of control',
  gad7:  'Worry, restlessness, or constant nervousness',
  cbi:   'Feeling drained, exhausted, or running on empty',
  phq9:  'Low mood, loss of interest, or feeling down',
}

export default function DomainCard({ domain, label, selected, onToggle }) {
  const Icon = ICONS[domain]
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className="w-full text-left"
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--r-xl)',
        border: selected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: selected ? 'var(--primary-subtle)' : 'var(--surface)',
        cursor: 'pointer',
        transition: 'border-color 150ms ease, background 150ms ease, transform 100ms ease',
        outline: 'none',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {Icon && (
          <Icon
            size={24}
            strokeWidth={1.75}
            color={selected ? 'var(--primary)' : 'var(--text-secondary)'}
          />
        )}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: selected ? 'var(--primary)' : 'var(--text-primary)',
        }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
        {DESCRIPTIONS[domain]}
      </p>
    </button>
  )
}
