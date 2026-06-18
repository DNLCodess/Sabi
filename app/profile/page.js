'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Shield, Phone, User, Hash, Trash2, TrendingUp, CheckCircle2 } from 'lucide-react'
import { getProfile, unlinkProfile, fetchOwnHistory } from '@/lib/profile'
import { ensureAnonSession } from '@/lib/supabase'

const TIER_LABELS = ['Doing well', 'Early signs', 'Mild–moderate', 'High', 'Urgent']
const TIER_COLORS = ['#15803D', '#B7791F', '#D97706', '#DC2626', '#B91C1C']
const BAND_DOT    = { 'Minimal': '#15803D', 'Mild': '#B7791F', 'Moderate': '#D97706', 'Severe': '#DC2626', 'Extreme': '#B91C1C' }

function TrendChart({ history }) {
  if (!history.length) return (
    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
      No check-in history yet. Complete a check-in to start your trend.
    </p>
  )

  const maxTier = 4
  const w = 400, h = 100, pad = 16
  const xs = history.map((_, i) => pad + (i / Math.max(history.length - 1, 1)) * (w - pad * 2))
  const ys = history.map(r => pad + ((maxTier - r.tier) / maxTier) * (h - pad * 2))

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ minWidth: 200, display: 'block' }}>
        <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
        {history.map((r, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r={5} fill={TIER_COLORS[r.tier]} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {new Date(history[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {new Date(history[history.length - 1].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile]   = useState(null)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [confirming, setConfirm] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [unlinked, setUnlinked] = useState(false)

  useEffect(() => {
    ensureAnonSession().then(() =>
      Promise.all([getProfile(), fetchOwnHistory()])
        .then(([p, h]) => { setProfile(p); setHistory(h) })
        .finally(() => setLoading(false))
    )
  }, [])

  const handleUnlink = async () => {
    setUnlinking(true)
    await unlinkProfile()
    setUnlinked(true)
    setUnlinking(false)
    setTimeout(() => router.push('/'), 1600)
  }

  if (loading) return null

  if (unlinked) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <CheckCircle2 size={48} color="#15803D" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>Profile unlinked</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Your contact details have been removed. Future check-ins will be fully anonymous again.</p>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', width: '100%', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <ArrowLeft size={20} strokeWidth={1.75} />
            </Link>
            <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
          </div>
          <Shield size={40} color="var(--primary)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>No profile linked</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 28px' }}>
            You haven&apos;t linked an emergency profile on this device. Complete a check-in and you&apos;ll be offered the option to link one.
          </p>
          <Link href="/check-in" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 24px', borderRadius: 'var(--r-full)', background: 'var(--grad-aurora)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>
            Start a check-in
          </Link>
        </div>
      </main>
    )
  }

  const latestTier = history.length ? history[history.length - 1].tier : null

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--background)', paddingBottom: 60 }}>
      <div style={{ maxWidth: 540, margin: '0 auto', width: '100%', padding: '24px 20px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={20} strokeWidth={1.75} />
          </Link>
          <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Your emergency profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 32px', lineHeight: 1.55 }}>
          This information is only visible to authorised counsellors if you send a distress signal.
        </p>

        {/* Profile details */}
        <div style={{ borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', background: 'var(--surface)', overflow: 'hidden', marginBottom: 24, boxShadow: 'var(--shadow-1)' }}>
          {[
            { Icon: Hash,  label: 'Matric number', value: profile.matric_number },
            { Icon: Phone, label: 'Phone',          value: profile.phone },
            { Icon: User,  label: 'Name',           value: profile.full_name ?? '—' },
          ].map(({ Icon, label, value }, i, arr) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <Icon size={16} color="var(--text-secondary)" strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'rgba(124,111,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Shield size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Linked {new Date(profile.consent_given_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Consent v{profile.consent_version?.replace('v', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Trend */}
        <div style={{ borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', background: 'var(--surface)', padding: '20px', marginBottom: 24, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color="var(--primary)" strokeWidth={1.75} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Your last 90 days</span>
            {latestTier !== null && (
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: TIER_COLORS[latestTier], background: `${TIER_COLORS[latestTier]}18`, padding: '3px 10px', borderRadius: 'var(--r-full)' }}>
                {TIER_LABELS[latestTier]}
              </span>
            )}
          </div>
          <TrendChart history={history} />
          {history.length > 0 && (
            <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {history.length} check-in{history.length > 1 ? 's' : ''} recorded · visible to your counselling team only in an emergency
            </p>
          )}
        </div>

        {/* Unlink */}
        {!confirming ? (
          <button
            onClick={() => setConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 'var(--r-full)',
              background: 'transparent', border: '1.5px solid var(--crisis)',
              color: 'var(--crisis)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={15} strokeWidth={2} /> Unlink my profile
          </button>
        ) : (
          <div style={{ borderRadius: 'var(--r-lg)', border: '1.5px solid var(--crisis)', background: '#FEF2F2', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#B91C1C', fontWeight: 600 }}>Are you sure?</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Your contact details will be removed. Counsellors won&apos;t be able to reach you if you send a distress signal from this device.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                style={{ flex: 1, padding: '11px', borderRadius: 'var(--r-full)', background: 'var(--crisis)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {unlinking ? 'Unlinking…' : 'Yes, unlink'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 'var(--r-full)', background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
