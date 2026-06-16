'use client'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

export default function MicroInterventionCard({ intervention }) {
  const [open, setOpen] = useState(false)
  if (!intervention) return null

  return (
    <div style={{
      borderRadius: 'var(--r-xl)',
      border: '1.5px solid var(--accent)',
      background: 'var(--mint)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full text-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {intervention.title}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent)',
              background: 'rgba(63,184,172,0.15)',
              borderRadius: 'var(--r-full)',
              padding: '2px 8px',
            }}>
              {intervention.duration}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            {intervention.description}
          </p>
        </div>
        <ChevronRight
          size={20}
          strokeWidth={1.75}
          color="var(--accent)"
          style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}
        />
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
          <ol style={{ paddingLeft: 20, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {intervention.steps.map((step, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
