'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import SabiAvatar from '@/components/SabiAvatar'
import AnswerChip from '@/components/AnswerChip'
import DomainCard from '@/components/DomainCard'
import FriendModeBadge from '@/components/FriendModeBadge'
import { ArrowLeft } from 'lucide-react'
import { PHQ9_ITEMS, GAD7_ITEMS, PHQ9_OPTIONS } from '@/lib/instruments'

// PHQ-4 = PHQ-9 items 0+1 (PHQ-2) + GAD-7 items 0+1 (GAD-2)
const GATEWAY_QUESTIONS = [
  { domainId: 'phq9', itemIndex: 0, item: PHQ9_ITEMS[0] },
  { domainId: 'phq9', itemIndex: 1, item: PHQ9_ITEMS[1] },
  { domainId: 'gad7', itemIndex: 0, item: GAD7_ITEMS[0] },
  { domainId: 'gad7', itemIndex: 1, item: GAD7_ITEMS[1] },
]

const DOMAIN_LIST = [
  { id: 'phq9',  label: 'Low mood' },
  { id: 'gad7',  label: 'Anxiety' },
  { id: 'pss10', label: 'Stress' },
  { id: 'cbi',   label: 'Burnout' },
]

function flagDomains(gatewayAnswers) {
  const phq2 = gatewayAnswers[0].value + gatewayAnswers[1].value
  const gad2 = gatewayAnswers[2].value + gatewayAnswers[3].value
  const flagged = new Set(['pss10', 'cbi'])
  if (phq2 >= 3) flagged.add('phq9')
  if (gad2 >= 3) flagged.add('gad7')
  return { flagged, phq2Flagged: phq2 >= 3, gad2Flagged: gad2 >= 3 }
}

function buildPreAnswers(gatewayAnswers) {
  return {
    phq9: [
      { itemIndex: 0, value: gatewayAnswers[0].value },
      { itemIndex: 1, value: gatewayAnswers[1].value },
    ],
    gad7: [
      { itemIndex: 0, value: gatewayAnswers[2].value },
      { itemIndex: 1, value: gatewayAnswers[3].value },
    ],
  }
}

function CheckInContent() {
  const router    = useRouter()
  const params    = useSearchParams()
  const [mode, setMode]           = useState('self')
  // 'gateway' | 'picker'
  const [phase, setPhase]         = useState('gateway')
  const [qIndex, setQIndex]       = useState(0)
  const [gatewayAnswers, setGatewayAnswers] = useState([])
  const [animating, setAnimating] = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const [phq2Flagged, setPhq2Flagged] = useState(false)
  const [gad2Flagged, setGad2Flagged] = useState(false)

  useEffect(() => {
    const m = params.get('mode') ?? sessionStorage.getItem('sabi_mode') ?? 'self'
    setMode(m)
    sessionStorage.setItem('sabi_mode', m)
  }, [params])

  const handleModeToggle = (m) => {
    setMode(m)
    sessionStorage.setItem('sabi_mode', m)
  }

  const isFriend = mode === 'friend'

  // ── Gateway answer handler ──
  const handleGatewayAnswer = (value) => {
    if (animating) return
    setAnimating(true)

    const newAnswers = [...gatewayAnswers, { value }]

    setTimeout(() => {
      setAnimating(false)
      if (qIndex < GATEWAY_QUESTIONS.length - 1) {
        setGatewayAnswers(newAnswers)
        setQIndex(i => i + 1)
      } else {
        // All 4 answered — score and move to picker
        const { flagged, phq2Flagged: p, gad2Flagged: g } = flagDomains(newAnswers)
        setGatewayAnswers(newAnswers)
        setPhq2Flagged(p)
        setGad2Flagged(g)
        setSelected(flagged)
        setPhase('picker')
      }
    }, 220)
  }

  const handleGatewayBack = () => {
    if (qIndex === 0) { router.back(); return }
    setGatewayAnswers(prev => prev.slice(0, -1))
    setQIndex(i => i - 1)
  }

  // ── Picker handlers ──
  const toggleDomain = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleContinue = () => {
    const preAnswers = buildPreAnswers(gatewayAnswers)
    sessionStorage.setItem('sabi_answers', JSON.stringify(preAnswers))
    sessionStorage.setItem('sabi_domains', JSON.stringify([...selected]))
    router.push('/screen')
  }

  // ── Gateway phase ──
  if (phase === 'gateway') {
    const current = GATEWAY_QUESTIONS[qIndex]
    const prefix  = isFriend ? 'How often has your friend' : 'Over the last while, how often have you'
    const text    = `${prefix} ${current.item.text.toLowerCase().replace(/\?$/, '')}?`

    return (
      <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
        {/* Thin gateway progress strip */}
        <div style={{ height: 3, background: 'var(--border)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
          <div style={{
            height: '100%',
            width: `${((qIndex + 1) / GATEWAY_QUESTIONS.length) * 100}%`,
            background: 'var(--grad-aurora)',
            transition: 'width 300ms ease',
            borderRadius: '0 var(--r-full) var(--r-full) 0',
          }} />
        </div>

        <div style={{ flex: 1, maxWidth: 560, margin: '0 auto', width: '100%', padding: '28px 20px 120px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleGatewayBack}
                aria-label="Back"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 'var(--r-full)',
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={18} strokeWidth={1.75} color="var(--text-secondary)" />
              </button>
              <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {qIndex + 1} of {GATEWAY_QUESTIONS.length}
              </span>
              <FriendModeBadge mode={mode} onToggle={handleModeToggle} />
            </div>
          </div>

          {/* SABI bubble */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
            <div style={{ paddingTop: 2 }}>
              <SabiAvatar size={42} />
            </div>
            <div style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px 20px 20px 20px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-2)',
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 200ms ease-out, transform 200ms ease-out',
            }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
                {qIndex === 0 && (
                  <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, fontStyle: 'italic' }}>
                    {isFriend ? "I'll ask a few quick questions about how they've been, then we'll go deeper where it matters." : "I'll ask a few quick questions about how you've been, then we'll focus on what matters most."}
                  </span>
                )}
                {text}
              </p>
            </div>
          </div>

          {/* Answer chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PHQ9_OPTIONS.map(opt => (
              <AnswerChip
                key={opt.value}
                label={opt.label}
                selected={false}
                onClick={() => handleGatewayAnswer(opt.value)}
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Picker phase ──
  const anyFlagged = phq2Flagged || gad2Flagged
  const flagNote = phq2Flagged && gad2Flagged
    ? "Your mood and anxiety scores suggest we look deeper at both."
    : phq2Flagged
      ? "Your mood score suggests we look deeper at that area."
      : gad2Flagged
        ? "Your anxiety score suggests we look deeper at that area."
        : "Your quick scores look stable — we'll still check stress and burnout."

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: 560, margin: '0 auto', width: '100%', padding: '20px 20px 140px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setPhase('gateway'); setQIndex(GATEWAY_QUESTIONS.length - 1); setGatewayAnswers(prev => prev.slice(0, -1)) }}
              aria-label="Back"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 'var(--r-full)',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} strokeWidth={1.75} color="var(--text-secondary)" />
            </button>
            <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
          </div>
          <FriendModeBadge mode={mode} onToggle={handleModeToggle} />
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.2 }}>
          {isFriend ? "Let's look closer" : "Let's go deeper"}
        </h1>

        {/* Flag note pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 'var(--r-full)',
          background: anyFlagged ? 'rgba(124,111,255,0.1)' : 'var(--surface)',
          border: `1px solid ${anyFlagged ? 'var(--lavender)' : 'var(--border)'}`,
          marginBottom: 24,
        }}>
          <span style={{ fontSize: '0.82rem', color: anyFlagged ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {flagNote}
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 24px', lineHeight: 1.6 }}>
          {isFriend
            ? "These areas are ready to screen. Adjust if needed."
            : "These areas are ready to screen. Adjust if needed."}
        </p>

        {/* Domain cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12, marginBottom: 8 }}>
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

        <button
          onClick={() => setSelected(new Set(DOMAIN_LIST.map(d => d.id)))}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: '12px 4px', fontFamily: 'var(--font-body)', display: 'block' }}
        >
          {isFriend ? "Check everything for them" : "Check everything"}
        </button>
      </div>

      {/* Sticky Continue */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 24px', background: 'rgba(250,251,255,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', zIndex: 40 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button
            onClick={handleContinue}
            disabled={selected.size === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', minHeight: 52,
              background: selected.size > 0 ? 'var(--grad-aurora)' : 'var(--border)',
              color: selected.size > 0 ? '#fff' : 'var(--text-disabled)',
              fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600,
              border: 'none', borderRadius: 'var(--r-full)',
              cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 200ms ease',
              boxShadow: selected.size > 0 ? '0 4px 20px rgba(124,111,255,0.25)' : 'none',
            }}
          >
            {selected.size === 0 ? 'Select at least one area' : `Start screening — ${selected.size} area${selected.size > 1 ? 's' : ''}`}
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
