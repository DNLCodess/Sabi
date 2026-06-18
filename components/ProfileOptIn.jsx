'use client'
import { useState, useEffect } from 'react'
import { Shield, Phone, User, Hash, X, CheckCircle2, ChevronRight } from 'lucide-react'
import { createProfile, getStoredProfileId } from '@/lib/profile'
import { ensureAnonSession } from '@/lib/supabase'
import { shouldShowReminder, recordDismissal, getReminderMessage } from '@/lib/reminders'

// ── Shared field styles ───────────────────────────────────────────────
const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)',
  background: 'var(--background)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
}

// ── Full card (results page) ──────────────────────────────────────────
function FullOptIn({ onLinked }) {
  const [matric, setMatric]     = useState('')
  const [phone, setPhone]       = useState('')
  const [name, setName]         = useState('')
  const [consented, setConsent] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  const canSubmit = matric.trim() && phone.trim() && consented && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await ensureAnonSession()
      await createProfile({
        matricNumber: matric.trim().toUpperCase(),
        phone:        phone.trim(),
        fullName:     name.trim() || null,
      })
      setDone(true)
      setTimeout(() => onLinked?.(), 1200)
    } catch (e) {
      setError(
        e.message?.includes('unique') || e.code === '23505'
          ? 'A profile already exists for this matric number. If this is you, you may already be linked on another device.'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        borderRadius: 'var(--r-lg)', border: '1.5px solid #15803D',
        background: 'rgba(21,128,61,0.06)', padding: '24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <CheckCircle2 size={28} color="#15803D" strokeWidth={2} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#15803D', fontSize: '1rem' }}>Profile linked</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Your team can now reach you in an emergency.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 'var(--r-lg)',
      border: '1.5px solid var(--border)',
      background: 'var(--surface)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-2)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 42, height: 42, minWidth: 42,
          borderRadius: 'var(--r-md)',
          background: 'rgba(124,111,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} color="var(--primary)" strokeWidth={2} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Make sure help can find you
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            If you ever send a distress signal, your counselling team needs a way to reach you.
            Your routine check-ins stay completely anonymous — this is only used in emergencies.
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Matric */}
        <div style={{ position: 'relative' }}>
          <Hash size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Matric number"
            value={matric}
            onChange={e => setMatric(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: 36 }}
            autoCapitalize="characters"
          />
        </div>

        {/* Phone */}
        <div style={{ position: 'relative' }}>
          <Phone size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: 36 }}
          />
        </div>

        {/* Name (optional) */}
        <div style={{ position: 'relative' }}>
          <User size={15} color="var(--text-secondary)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Full name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: 36 }}
          />
        </div>

        {/* Consent */}
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', paddingTop: 4 }}>
          <input
            type="checkbox"
            checked={consented}
            onChange={e => setConsent(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            I understand my contact details and check-in results will be visible to authorised
            counsellors only if I send a distress signal or a counsellor reviews my profile.
          </span>
        </label>

        {error && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--crisis)', lineHeight: 1.4 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 20px',
            borderRadius: 'var(--r-full)',
            background: canSubmit ? 'var(--grad-aurora)' : 'var(--border)',
            color: canSubmit ? '#fff' : 'var(--text-disabled)',
            border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 200ms',
            boxShadow: canSubmit ? '0 4px 16px rgba(124,111,255,0.22)' : 'none',
          }}
        >
          {loading ? 'Linking…' : 'Link my profile'}
          {!loading && <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  )
}

// ── Compact banner (landing / check-in) ──────────────────────────────
function CompactBanner({ onLinked, onDismiss, message }) {
  const [expanded, setExpanded] = useState(false)
  const [matric, setMatric]     = useState('')
  const [phone, setPhone]       = useState('')
  const [consented, setConsent] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  const canSubmit = matric.trim() && phone.trim() && consented && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await ensureAnonSession()
      await createProfile({ matricNumber: matric.trim().toUpperCase(), phone: phone.trim() })
      setDone(true)
      setTimeout(() => onLinked?.(), 1400)
    } catch (e) {
      setError(
        e.message?.includes('unique') || e.code === '23505'
          ? 'A profile already exists for this matric number.'
          : 'Something went wrong. Try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        borderRadius: 'var(--r-md)', border: '1.5px solid #15803D',
        background: 'rgba(21,128,61,0.07)', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <CheckCircle2 size={18} color="#15803D" />
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#15803D' }}>Profile linked — help can now find you.</span>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 'var(--r-md)',
      border: '1.5px solid rgba(124,111,255,0.3)',
      background: 'rgba(124,111,255,0.05)',
      overflow: 'hidden',
    }}>
      {/* Collapsed row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Shield size={18} color="var(--primary)" strokeWidth={2} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {message.heading}
          </p>
          {!expanded && (
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {message.body}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--r-full)',
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            {expanded ? 'Collapse' : 'Link now'}
          </button>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              width: 30, height: 30, borderRadius: 'var(--r-full)',
              background: 'transparent', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={14} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message.body}
          </p>
          <input
            type="text" placeholder="Matric number"
            value={matric} onChange={e => setMatric(e.target.value)}
            style={{ ...fieldStyle, fontSize: '0.9rem', padding: '10px 12px' }}
            autoCapitalize="characters"
          />
          <input
            type="tel" placeholder="Phone number"
            value={phone} onChange={e => setPhone(e.target.value)}
            style={{ ...fieldStyle, fontSize: '0.9rem', padding: '10px 12px' }}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={consented} onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--primary)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              My contact details will only be shared with authorised counsellors if I send a distress signal.
            </span>
          </label>
          {error && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--crisis)' }}>{error}</p>}
          <button
            onClick={handleSubmit} disabled={!canSubmit}
            style={{
              padding: '10px', borderRadius: 'var(--r-full)',
              background: canSubmit ? 'var(--primary)' : 'var(--border)',
              color: canSubmit ? '#fff' : 'var(--text-disabled)',
              border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Linking…' : 'Link my profile'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── SOS nudge (non-dismissible, urgent framing) ───────────────────────
function SosNudge({ onLinked }) {
  const [matric, setMatric]     = useState('')
  const [phone, setPhone]       = useState('')
  const [name, setName]         = useState('')
  const [consented, setConsent] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  const canSubmit = matric.trim() && phone.trim() && consented && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await ensureAnonSession()
      await createProfile({
        matricNumber: matric.trim().toUpperCase(),
        phone:        phone.trim(),
        fullName:     name.trim() || null,
      })
      setDone(true)
      setTimeout(() => onLinked?.(), 900)
    } catch (e) {
      setError(
        e.message?.includes('unique') || e.code === '23505'
          ? 'A profile already exists for this matric number.'
          : 'Something went wrong. Try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{
        borderRadius: 'var(--r-md)', border: '1.5px solid #15803D',
        background: 'rgba(21,128,61,0.07)', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <CheckCircle2 size={18} color="#15803D" />
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#15803D' }}>Profile linked — counsellors can now reach you.</span>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 'var(--r-md)',
      border: '1.5px solid rgba(185,28,28,0.25)',
      background: 'rgba(185,28,28,0.04)',
      padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Shield size={18} color="var(--crisis)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--crisis)' }}>
            Counsellors can&apos;t reach you yet
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your profile isn&apos;t linked. If you send a distress signal, the team will know your location
            but won&apos;t have a number to call. Link now — it takes 30 seconds.
          </p>
        </div>
      </div>

      <input
        type="text" placeholder="Matric number"
        value={matric} onChange={e => setMatric(e.target.value)}
        style={{ ...fieldStyle, fontSize: '0.88rem', padding: '10px 12px' }}
        autoCapitalize="characters"
      />
      <input
        type="tel" placeholder="Phone number"
        value={phone} onChange={e => setPhone(e.target.value)}
        style={{ ...fieldStyle, fontSize: '0.88rem', padding: '10px 12px' }}
      />
      <input
        type="text" placeholder="Full name (optional)"
        value={name} onChange={e => setName(e.target.value)}
        style={{ ...fieldStyle, fontSize: '0.88rem', padding: '10px 12px' }}
      />
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input
          type="checkbox" checked={consented} onChange={e => setConsent(e.target.checked)}
          style={{ marginTop: 2, accentColor: 'var(--crisis)', flexShrink: 0 }}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          My contact details will only be visible to authorised counsellors if I send a distress signal.
        </span>
      </label>
      {error && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--crisis)' }}>{error}</p>}
      <button
        onClick={handleSubmit} disabled={!canSubmit}
        style={{
          padding: '11px', borderRadius: 'var(--r-full)',
          background: canSubmit ? 'var(--crisis)' : 'var(--border)',
          color: canSubmit ? '#fff' : 'var(--text-disabled)',
          border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Linking…' : 'Link my profile'}
      </button>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────
/**
 * variant: 'full' | 'compact' | 'sos'
 * - full:    large card shown on results page after screening
 * - compact: dismissible banner shown on landing / check-in start
 * - sos:     urgent non-dismissible form on the SOS page
 *
 * onLinked:  callback when profile is successfully created
 */
export default function ProfileOptIn({ variant = 'full', onLinked }) {
  const [visible, setVisible]   = useState(false)
  const [message, setMessage]   = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const alreadyLinked = !!getStoredProfileId()
    if (alreadyLinked) { setVisible(false); return }

    const forceShow = variant === 'sos'
    if (shouldShowReminder(forceShow)) {
      setMessage(getReminderMessage())
      setVisible(true)
    }
  }, [variant])

  if (!visible) return null

  const handleDismiss = () => {
    recordDismissal()
    setVisible(false)
  }

  const handleLinked = () => {
    setVisible(false)
    onLinked?.()
  }

  if (variant === 'compact') {
    return (
      <CompactBanner
        message={message}
        onLinked={handleLinked}
        onDismiss={handleDismiss}
      />
    )
  }

  if (variant === 'sos') {
    return <SosNudge onLinked={handleLinked} />
  }

  return <FullOptIn onLinked={handleLinked} />
}
