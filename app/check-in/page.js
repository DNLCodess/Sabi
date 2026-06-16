'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import DomainCard from '@/components/DomainCard'
import FriendModeBadge from '@/components/FriendModeBadge'
import { ArrowLeft } from 'lucide-react'

const DOMAIN_LIST = [
  { id: 'pss10', label: 'Stress' },
  { id: 'gad7',  label: 'Anxiety' },
  { id: 'cbi',   label: 'Burnout' },
  { id: 'phq9',  label: 'Low mood' },
]

function CheckInContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode] = useState('self')
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    const m = params.get('mode') ?? sessionStorage.getItem('sabi_mode') ?? 'self'
    setMode(m)
    sessionStorage.setItem('sabi_mode', m)
  }, [params])

  const handleModeToggle = (m) => {
    setMode(m)
    sessionStorage.setItem('sabi_mode', m)
  }

  const toggleDomain = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(DOMAIN_LIST.map(d => d.id)))

  const handleContinue = () => {
    sessionStorage.setItem('sabi_domains', JSON.stringify([...selected]))
    router.push('/screen')
  }

  const isFriend = mode === 'friend'

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        maxWidth: 560,
        margin: '0 auto',
        width: '100%',
        padding: '20px 20px 140px',
      }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" aria-label="Back to home" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 'var(--r-full)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}>
              <ArrowLeft size={18} strokeWidth={1.75} />
            </Link>
            <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
          </div>
          <FriendModeBadge mode={mode} onToggle={handleModeToggle} />
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw + 0.5rem, 2rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          lineHeight: 1.2,
        }}>
          {isFriend ? "What have you been noticing about them?" : "What dey weigh you down?"}
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          margin: '0 0 28px',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
        }}>
          {isFriend
            ? "Pick the areas where you've noticed changes. You can select more than one."
            : "Select everything that applies. You can pick more than one."}
        </p>

        {/* Domain cards — 1 col mobile, 2 col tablet */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 12,
          marginBottom: 8,
        }}>
          {DOMAIN_LIST.map(({ id, label }) => (
            <DomainCard
              key={id}
              domain={id}
              label={label}
              selected={selected.has(id)}
              onToggle={() => toggleDomain(id)}
            />
          ))}
        </div>

        {/* Select all */}
        <button
          onClick={selectAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '12px 4px',
            fontFamily: 'var(--font-body)',
            display: 'block',
          }}
        >
          {isFriend ? "Not sure — check everything for them" : "Not sure — check everything"}
        </button>
      </div>

      {/* Sticky Continue */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        padding: '12px 20px 24px',
        background: 'rgba(250,251,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button
            onClick={handleContinue}
            disabled={selected.size === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: 52,
              background: selected.size > 0 ? 'var(--grad-aurora)' : 'var(--border)',
              color: selected.size > 0 ? '#fff' : 'var(--text-disabled)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--r-full)',
              cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease',
              boxShadow: selected.size > 0 ? '0 4px 20px rgba(124,111,255,0.25)' : 'none',
            }}
          >
            {selected.size === 0
              ? 'Select at least one area'
              : `Continue — ${selected.size} area${selected.size > 1 ? 's' : ''} selected`}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  )
}
