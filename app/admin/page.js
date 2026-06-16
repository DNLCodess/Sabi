'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import HeatmapStat from '@/components/HeatmapStat'
import { fetchHeatmapStats } from '@/lib/supabase'

const TIER_LABELS = ['Well', 'Early signs', 'Mild–moderate', 'High', 'Urgent/crisis']
const TIER_COLORS = ['#1E9E8A', '#5B8DEF', '#B7791F', '#D9534F', '#B91C1C']

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [appUrl, setAppUrl] = useState('https://sabi.app')

  useEffect(() => {
    setAppUrl(window.location.origin)
    fetchHeatmapStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      padding: '40px 24px 80px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 className="text-h1" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            SABI — Campus Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Anonymous aggregate data only. No individual student data is stored or shown.
          </p>
        </div>

        {loading && (
          <p style={{ color: 'var(--text-secondary)' }}>Loading stats…</p>
        )}

        {error && (
          <p style={{ color: 'var(--crisis)' }}>Could not load stats: {error}</p>
        )}

        {stats && (
          <>
            {/* Top stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 40,
            }}>
              <HeatmapStat
                label="Total check-ins"
                value={stats.total.toLocaleString()}
                highlight
              />
              <HeatmapStat
                label="This week"
                value={stats.weekTotal.toLocaleString()}
                sub="last 7 days"
              />
              <HeatmapStat
                label="Moderate or above"
                value={`${stats.moderatePct}%`}
                sub={`${stats.moderatePlus} students`}
              />
            </div>

            {/* Tier breakdown */}
            <div style={{ marginBottom: 40 }}>
              <h2 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
                Tier breakdown (all time)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.tierCounts.map(({ tier, count }) => {
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 120, fontSize: '0.875rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {TIER_LABELS[tier]}
                      </span>
                      <div style={{
                        flex: 1,
                        height: 12,
                        background: 'var(--border)',
                        borderRadius: 'var(--r-full)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: TIER_COLORS[tier],
                          borderRadius: 'var(--r-full)',
                          transition: 'width 600ms ease',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', width: 32, textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* QR for poster */}
        <div style={{
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          padding: '28px 24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-2)',
        }}>
          <div>
            <h3 className="text-h3" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
              Share SABI
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 300 }}>
              Print this QR code for hostel noticeboards, lecture halls, and common rooms. Anyone who scans it can check in anonymously.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-disabled)', fontFamily: 'monospace' }}>
              {appUrl}
            </p>
          </div>
          <div style={{
            padding: 16,
            background: 'var(--surface)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
          }}>
            <QRCodeSVG value={appUrl} size={160} bgColor="transparent" level="M" />
          </div>
        </div>
      </div>
    </main>
  )
}
