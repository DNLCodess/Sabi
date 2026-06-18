'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SabiAvatar from '@/components/SabiAvatar'
import CrisisBar from '@/components/CrisisBar'
import ResultBand from '@/components/ResultBand'
import BarrierPanel from '@/components/BarrierPanel'
import MicroInterventionCard from '@/components/MicroInterventionCard'
import ProfileOptIn from '@/components/ProfileOptIn'
import { BARRIER_PANEL, RESOURCES, PEER_SUPPORT_TIPS } from '@/lib/resources'
import { pushCheckinHistory, incrementCheckinCount } from '@/lib/profile'
import { HeartHandshake, PhoneCall, BookOpen, CheckCircle2, AlertCircle, Users } from 'lucide-react'

const ICON_MAP = { HeartHandshake, PhoneCall, BookOpen, CheckCircle2, AlertCircle }

const TIER_LABELS = ['Doing well', 'Early signs', 'Mild–moderate', 'High', 'Urgent']

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sabi_result')
    if (!raw) { router.replace('/'); return }
    const parsed = JSON.parse(raw)
    setResult(parsed)
    // Push to linked check-in history + increment local count
    incrementCheckinCount()
    pushCheckinHistory({ tier: parsed.overall_tier, mode: parsed.mode, domains: parsed.domains })
  }, [router])

  if (!result) return null

  const {
    overall_tier,
    safety_triggered,
    mode,
    domains,
    fired_rules,
    sabi_message,
    micro_intervention,
    resources_to_show,
  } = result

  const isFriend = mode === 'friend'

  const resources = resources_to_show?.length ? resources_to_show : RESOURCES.slice(0, 2)

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      paddingBottom: 64,
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
          {isFriend && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--r-full)',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--lavender)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--primary)',
            }}>
              <Users size={14} strokeWidth={2} /> For a friend
            </div>
          )}
        </div>

        {/* Crisis bar */}
        {safety_triggered && <CrisisBar />}

        {/* SABI message */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 32, alignItems: 'flex-start' }}>
          <SabiAvatar size={44} />
          <div style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px 20px 20px 20px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-2)',
          }}>
            <p className="text-body-lg" style={{ margin: 0, color: 'var(--text-primary)' }}>
              {sabi_message}
            </p>
          </div>
        </div>

        {/* Tier label */}
        <div style={{ marginBottom: 20 }}>
          <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>Overall picture</span>
          <h2 className="text-h3" style={{ color: 'var(--text-primary)', marginTop: 4 }}>
            {TIER_LABELS[overall_tier] ?? 'Reviewed'}
          </h2>
        </div>

        {/* Domain bands */}
        {domains.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {domains.map(d => (
              <ResultBand
                key={d.name}
                label={d.label}
                score={d.score}
                band={d.band}
                weight={d.weight}
              />
            ))}
          </div>
        )}

        {/* Why you're seeing this */}
        {fired_rules?.length > 0 && (
          <div style={{
            padding: '20px 22px',
            borderRadius: 'var(--r-xl)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertCircle size={18} strokeWidth={1.75} color="var(--primary)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Why you're seeing this
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fired_rules.map((rule, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Micro-intervention (F3) */}
        {micro_intervention && (
          <div style={{ marginBottom: 24 }}>
            <span className="text-caption" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              {isFriend ? 'Something to share with them' : 'Something to try right now'}
            </span>
            <MicroInterventionCard intervention={micro_intervention} />
          </div>
        )}

        {/* Barrier panel */}
        <div style={{ marginBottom: 24 }}>
          <BarrierPanel items={BARRIER_PANEL} />
        </div>

        {/* Resources */}
        {resources.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <span className="text-caption" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
              {isFriend ? 'Support options for your friend' : 'Support options'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resources.map(r => {
                const Icon = ICON_MAP[r.icon]
                return (
                  <div key={r.type} style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}>
                    {Icon && <Icon size={22} strokeWidth={1.75} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.detail}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Friend mode guidance (F5) */}
        {isFriend && (
          <div style={{
            padding: '22px',
            borderRadius: 'var(--r-xl)',
            background: 'var(--sky)',
            border: '1px solid var(--secondary)',
            marginBottom: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Users size={20} strokeWidth={1.75} color="var(--secondary)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                How to talk to your friend
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PEER_SUPPORT_TIPS.map(tip => (
                <div key={tip.heading}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '0.9rem' }}>
                    {tip.heading}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {tip.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile opt-in — shown after results if not yet linked */}
        {!isFriend && (
          <div style={{ marginBottom: 28 }}>
            <ProfileOptIn variant="full" />
          </div>
        )}

        {/* Start over */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline',
            }}
          >
            Start a new check-in
          </Link>
        </div>
      </div>
    </main>
  )
}
