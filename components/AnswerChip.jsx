'use client'

export default function AnswerChip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left"
      style={{
        minHeight: 52,
        padding: '14px 20px',
        borderRadius: 'var(--r-full)',
        border: selected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: selected ? 'var(--primary-subtle)' : 'var(--surface)',
        color: selected ? 'var(--primary)' : 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'border-color 120ms ease, background 120ms ease, color 120ms ease, transform 80ms ease',
        outline: 'none',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {label}
    </button>
  )
}
