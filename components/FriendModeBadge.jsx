'use client'
import { Users, User } from 'lucide-react'

export default function FriendModeBadge({ mode, onToggle }) {
  const isFriend = mode === 'friend'
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => onToggle('self')}
        aria-pressed={!isFriend}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          borderRadius: 'var(--r-full)',
          border: !isFriend ? '2px solid var(--primary)' : '1.5px solid var(--border)',
          background: !isFriend ? 'var(--primary-subtle)' : 'var(--surface)',
          color: !isFriend ? 'var(--primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <User size={16} strokeWidth={1.75} />
        For me
      </button>
      <button
        onClick={() => onToggle('friend')}
        aria-pressed={isFriend}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          borderRadius: 'var(--r-full)',
          border: isFriend ? '2px solid var(--primary)' : '1.5px solid var(--border)',
          background: isFriend ? 'var(--primary-subtle)' : 'var(--surface)',
          color: isFriend ? 'var(--primary)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <Users size={16} strokeWidth={1.75} />
        For a friend
      </button>
    </div>
  )
}
