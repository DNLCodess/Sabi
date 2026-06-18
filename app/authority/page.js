'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  LayoutDashboard, BellRing, BarChart3, QrCode, Settings,
  LogOut, LifeBuoy, CheckCircle2, Phone, TrendingUp, TrendingDown,
  Minus, Users, User, AlertTriangle, RefreshCw, Copy, Check,
  Activity, MapPin, Navigation2, X, Plus,
} from 'lucide-react'
import {
  getAuthorityClient, signOut,
  fetchDistressSignals, resolveSignal,
  fetchAuthoritySettings, updateAuthoritySettings,
  fetchDashboardData,
} from '@/lib/authorityClient'

// ── Audio alert ───────────────────────────────────────────────────────
function playAlertTone() {
  try {
    const ctx   = new AudioContext()
    const tones = [523, 784, 523, 784, 523]
    let t = ctx.currentTime
    for (const freq of tones) {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.4, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc.start(t); osc.stop(t + 0.28)
      t += 0.32
    }
  } catch {}
}

// ── Data helpers ──────────────────────────────────────────────────────
function groupByDay(results, days = 14) {
  const map = {}
  for (let i = days - 1; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    map[key]  = { date: key, count: 0, label: d.toLocaleDateString('en-NG', { weekday: 'short' }) }
  }
  for (const r of results) {
    const key = r.created_at.slice(0, 10)
    if (map[key]) map[key].count++
  }
  return Object.values(map)
}

function computeDomainBreakdown(results) {
  const domains = [
    { key: 'phq9',  label: 'Low mood',  bandKey: 'phq9_band',  moderate: ['Moderate', 'Moderately severe', 'Severe'] },
    { key: 'gad7',  label: 'Anxiety',   bandKey: 'gad7_band',  moderate: ['Moderate', 'Severe'] },
    { key: 'pss10', label: 'Stress',    bandKey: 'pss10_band', moderate: ['High'] },
    { key: 'cbi',   label: 'Burnout',   bandKey: 'cbi_band',   moderate: ['Moderate', 'High', 'Severe'] },
  ]
  return domains.map(d => {
    const withDomain = results.filter(r => r[d.bandKey])
    const modPlus    = withDomain.filter(r => d.moderate.includes(r[d.bandKey]))
    return {
      ...d,
      total:    withDomain.length,
      modPlus:  modPlus.length,
      rate:     withDomain.length > 0 ? Math.round((modPlus.length / withDomain.length) * 100) : 0,
    }
  })
}

function weekTrend(curr, prev) {
  if (prev === 0) return { pct: null, dir: 'neutral' }
  const pct = Math.round(((curr - prev) / prev) * 100)
  return { pct: Math.abs(pct), dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' }
}

// ── Chart components ──────────────────────────────────────────────────
const TIER_COLORS  = ['#1E9E8A', '#5B8DEF', '#B7791F', '#D9534F', '#B91C1C']
const TIER_LABELS  = ['Well', 'Early signs', 'Mild–moderate', 'High', 'Urgent']
const DOMAIN_COLORS = { phq9: '#5B8DEF', gad7: '#7C6FFF', pss10: '#B7791F', cbi: '#D9534F' }

function TierDonut({ tierCounts, total }) {
  const r = 54, cx = 70, cy = 70
  const circ = 2 * Math.PI * r
  let acc = 0
  const slices = tierCounts.map(({ tier, count }) => {
    const dash   = total > 0 ? (count / total) * circ : 0
    const offset = circ / 4 - acc
    acc += dash
    return { tier, count, dash, offset }
  })
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {total === 0
          ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={22} />
          : slices.map(s => s.dash > 0.5 && (
            <circle key={s.tier} cx={cx} cy={cy} r={r} fill="none"
              stroke={TIER_COLORS[s.tier]} strokeWidth={22}
              strokeDasharray={`${s.dash} ${circ}`}
              strokeDashoffset={s.offset}
            />
          ))
        }
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--text-primary)">
          {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {slices.map(s => (
          <div key={s.tier} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: TIER_COLORS[s.tier], flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{TIER_LABELS[s.tier]}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto', minWidth: 20, textAlign: 'right' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sparkline({ data, color = '#7C6FFF' }) {
  if (!data?.length) return null
  const W = 400, H = 60, pad = 4
  const max  = Math.max(...data.map(d => d.count), 1)
  const xStep = (W - pad * 2) / Math.max(data.length - 1, 1)
  const pts   = data.map((d, i) => `${pad + i * xStep},${H - pad - (d.count / max) * (H - pad * 2)}`).join(' ')
  const last  = data[data.length - 1]
  const lx    = pad + (data.length - 1) * xStep
  const ly    = H - pad - (last.count / max) * (H - pad * 2)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${H - pad} ${pts} ${lx},${H - pad}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={4} fill={color} />
    </svg>
  )
}

function DayBars({ data }) {
  const max = Math.max(...(data?.map(d => d.count) ?? []), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 72 }}>
      {(data ?? []).map(d => (
        <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%`,
              background: 'var(--primary)',
              opacity: 0.5 + (d.count / max) * 0.5,
              borderRadius: '3px 3px 0 0',
              minHeight: 2,
              transition: 'height 400ms ease',
            }} title={`${d.date}: ${d.count}`} />
          </div>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: 0 }}>
            {d.label?.slice(0, 1)}
          </span>
        </div>
      ))}
    </div>
  )
}

function DomainBars({ breakdown }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {breakdown.map(d => (
        <div key={d.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: d.rate >= 40 ? 'var(--crisis)' : d.rate >= 25 ? 'var(--warning)' : 'var(--success)' }}>
              {d.total > 0 ? `${d.rate}%` : '—'}
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${d.rate}%`,
              background: d.rate >= 40 ? 'var(--crisis)' : d.rate >= 25 ? 'var(--warning-soft)' : 'var(--success)',
              borderRadius: 'var(--r-full)',
              transition: 'width 600ms ease',
            }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>
            {d.total > 0 ? `${d.modPlus} of ${d.total} screened` : 'No data this week'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconColor, trend, alert }) {
  const { pct, dir } = trend ?? {}
  return (
    <div style={{
      padding: '20px 22px',
      borderRadius: 'var(--r-xl)',
      background: alert ? '#FEF2F2' : 'var(--surface)',
      border: `1.5px solid ${alert ? 'var(--crisis)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: 'var(--shadow-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</span>
        {Icon && <Icon size={18} strokeWidth={1.75} color={iconColor ?? 'var(--primary)'} />}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: alert ? 'var(--crisis)' : 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {sub && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sub}</span>}
        {pct !== null && pct !== undefined && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--r-full)',
            padding: '2px 7px',
            background: dir === 'up' ? '#DCFCE7' : dir === 'down' ? '#FEE2E2' : 'var(--border)',
            color: dir === 'up' ? '#15803D' : dir === 'down' ? '#B91C1C' : 'var(--text-secondary)',
          }}>
            {dir === 'up' ? <TrendingUp size={10} /> : dir === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
            {pct}% vs last wk
          </span>
        )}
      </div>
    </div>
  )
}

// ── Section: Overview ─────────────────────────────────────────────────
function Overview({ dashData, signals, lastRefreshed, onRefresh, refreshing }) {
  if (!dashData) return <p style={{ color: 'var(--text-secondary)' }}>Loading overview…</p>

  const { total, results, weekResults, prevWeekResults, todayResults } = dashData
  const trend       = weekTrend(weekResults.length, prevWeekResults.length)
  const modPlus30   = results.filter(r => r.tier >= 2).length
  const modPct30    = results.length > 0 ? Math.round((modPlus30 / results.length) * 100) : 0
  const tierCounts  = [0,1,2,3,4].map(t => ({ tier: t, count: results.filter(r => r.tier === t).length }))
  const daily7      = groupByDay(results, 7)
  const daily14     = groupByDay(results, 14)
  const activeAlerts = signals.filter(s => !s.resolved)

  return (
    <div>
      {/* Refresh row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Campus Overview
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRefreshed && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 'var(--r-full)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}
          >
            <RefreshCw size={13} strokeWidth={2} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* Active alert banner */}
      {activeAlerts.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', borderRadius: 'var(--r-xl)',
          background: '#FEF2F2', border: '2px solid var(--crisis)',
          marginBottom: 24, animation: 'pulseBorder 2s ease-in-out infinite',
        }}>
          <style>{`@keyframes pulseBorder { 0%,100%{box-shadow:0 0 0 0 rgba(217,83,79,0.3)} 50%{box-shadow:0 0 0 6px rgba(217,83,79,0)} }`}</style>
          <AlertTriangle size={22} strokeWidth={1.75} color="var(--crisis)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: '#B91C1C', fontSize: '0.95rem' }}>
              {activeAlerts.length} active distress signal{activeAlerts.length > 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block', marginTop: 2 }}>
              Go to Alerts to respond
            </span>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="g-kpi">
        <StatCard label="Total check-ins" value={total.toLocaleString()} sub="all time" icon={Activity} iconColor="var(--primary)" />
        <StatCard label="This week" value={weekResults.length} sub="last 7 days" icon={TrendingUp} iconColor="var(--success)" trend={trend} />
        <StatCard label="Today" value={todayResults.length} sub="check-ins so far" icon={LayoutDashboard} iconColor="var(--secondary)" />
        <StatCard
          label="Active alerts"
          value={activeAlerts.length}
          sub={activeAlerts.length > 0 ? 'needs response' : 'campus clear'}
          icon={BellRing}
          iconColor={activeAlerts.length > 0 ? 'var(--crisis)' : 'var(--success)'}
          alert={activeAlerts.length > 0}
        />
      </div>

      {/* Charts row */}
      <div className="g-charts">

        {/* 7-day sparkline */}
        <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Check-ins — last 7 days</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
            {weekResults.length}
          </div>
          <Sparkline data={daily7} />
        </div>

        {/* Tier donut */}
        <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 16 }}>Tier distribution — last 30 days</div>
          <TierDonut tierCounts={tierCounts} total={results.length} />
        </div>

        {/* Moderate+ rate */}
        <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 8 }}>Moderate or above</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: modPct30 >= 40 ? 'var(--crisis)' : modPct30 >= 25 ? 'var(--warning)' : 'var(--success)', lineHeight: 1, marginBottom: 6 }}>
            {modPct30}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 16 }}>of check-ins in last 30 days</div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${modPct30}%`, background: modPct30 >= 40 ? 'var(--crisis)' : 'var(--warning-soft)', borderRadius: 'var(--r-full)', transition: 'width 600ms ease' }} />
          </div>
        </div>

      </div>

      {/* 14-day bar chart */}
      <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)', marginBottom: 28 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 16 }}>Daily check-ins — last 14 days</div>
        <DayBars data={daily14} />
      </div>

      {/* Recent check-ins */}
      <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 16 }}>Recent check-ins</div>
        {results.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>No check-ins in the last 30 days.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {results.slice(0, 8).map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: i < 7 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.mode === 'friend'
                    ? <Users size={14} strokeWidth={1.75} color="var(--secondary)" />
                    : <User size={14} strokeWidth={1.75} color="var(--primary)" />}
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {' '}·{' '}
                    {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
                    borderRadius: 'var(--r-full)',
                    background: `${TIER_COLORS[r.tier]}22`,
                    color: TIER_COLORS[r.tier],
                  }}>
                    {TIER_LABELS[r.tier]}
                  </span>
                  {r.mode === 'friend' && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>proxy</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section: Alerts ───────────────────────────────────────────────────
function AlertsPanel({ signals, onResolve, resolving, settings }) {
  const active   = signals.filter(s => !s.resolved)
  const resolved = signals.filter(s => s.resolved).slice(0, 20)

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 24px' }}>
        Distress Alerts
      </h2>

      {/* Summary row */}
      <div className="g-kpi3">
        <StatCard label="Active now" value={active.length} sub={active.length > 0 ? 'needs response' : 'all clear'} icon={BellRing} iconColor={active.length > 0 ? 'var(--crisis)' : 'var(--success)'} alert={active.length > 0} />
        <StatCard label="Resolved" value={resolved.length} sub="last 30 days" icon={CheckCircle2} iconColor="var(--success)" />
        <StatCard label="Total signals" value={signals.length} sub="last 30 days" icon={LifeBuoy} iconColor="var(--primary)" />
      </div>

      {/* Active alerts */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 14 }}>
          Active ({active.length})
        </div>
        {active.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)' }}>
            <CheckCircle2 size={36} strokeWidth={1.5} color="var(--success)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>No active distress signals</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Checks every 10 seconds automatically.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {active.map(sig => {
              const hasCoords = sig.lat != null && sig.lng != null
              const accColor  = !sig.gps_accuracy_m ? null : sig.gps_accuracy_m < 25 ? '#15803D' : sig.gps_accuracy_m < 100 ? '#B7791F' : '#B91C1C'
              const mapsLink  = hasCoords ? `https://www.google.com/maps?q=${sig.lat},${sig.lng}&z=18` : null
              return (
                <div key={sig.id} style={{ borderRadius: 'var(--r-xl)', background: '#FEF2F2', border: '2px solid var(--crisis)', overflow: 'hidden' }}>

                  {/* Header row */}
                  <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <LifeBuoy size={26} strokeWidth={1.5} color="var(--crisis)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#B91C1C', fontSize: '0.95rem', marginBottom: 3 }}>
                        {sig.contact_name ? sig.contact_name : 'Anonymous distress signal'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(sig.created_at).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
                        {new Date(sig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* Call button — shown if student's phone is known */}
                    {sig.contact_phone && (
                      <a href={`tel:${sig.contact_phone.replace(/[\s\-()]/g, '')}`} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 'var(--r-full)',
                        background: 'var(--crisis)', color: '#fff',
                        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem',
                        textDecoration: 'none', flexShrink: 0,
                      }}>
                        <Phone size={13} strokeWidth={2.5} /> {sig.contact_phone}
                      </a>
                    )}
                  </div>

                  {/* Screening snapshot row */}
                  {sig.screening_snapshot && (
                    <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(185,28,28,0.1)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginRight: 4 }}>Last check-in</span>
                      {[
                        { label: 'Mood',    val: sig.screening_snapshot.phq9_band },
                        { label: 'Anxiety', val: sig.screening_snapshot.gad7_band },
                        { label: 'Stress',  val: sig.screening_snapshot.pss10_band },
                        { label: 'Burnout', val: sig.screening_snapshot.cbi_band },
                      ].filter(b => b.val).map(b => (
                        <span key={b.label} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--r-full)', background: 'rgba(185,28,28,0.08)', color: '#B91C1C' }}>
                          {b.label}: {b.val}
                        </span>
                      ))}
                      {sig.screening_snapshot.tier != null && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: '#B91C1C' }}>
                          Tier {sig.screening_snapshot.tier}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Location row */}
                  <div style={{ padding: '12px 22px', background: 'rgba(185,28,28,0.04)', borderTop: '1px solid rgba(185,28,28,0.12)', borderBottom: '1px solid rgba(185,28,28,0.12)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {sig.building && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1.5px solid #B91C1C', borderRadius: 'var(--r-full)', padding: '5px 12px' }}>
                        <MapPin size={13} strokeWidth={2} color="#B91C1C" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B91C1C' }}>{sig.building}</span>
                      </div>
                    )}
                    {hasCoords && sig.gps_accuracy_m && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accColor, background: `${accColor}18`, padding: '4px 10px', borderRadius: 'var(--r-full)' }}>
                        ±{sig.gps_accuracy_m}m
                      </span>
                    )}
                    {!hasCoords && !sig.building && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Location not shared</span>
                    )}
                    {/* Map buttons */}
                    {mapsLink && (
                      <a href={mapsLink} target="_blank" rel="noreferrer" style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 'var(--r-full)',
                        background: 'var(--surface)', border: '1.5px solid var(--border)',
                        color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600,
                        textDecoration: 'none', fontFamily: 'var(--font-body)',
                      }}>
                        <Navigation2 size={12} strokeWidth={2} /> Maps
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '14px 22px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {settings?.outreach_number && (
                      <a href={`tel:${settings.outreach_number.replace(/[\s\-()]/g, '')}`} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 'var(--r-full)',
                        background: 'var(--surface)', border: '1.5px solid var(--crisis)',
                        color: 'var(--crisis)', fontWeight: 600, fontSize: '0.85rem',
                        textDecoration: 'none', fontFamily: 'var(--font-body)',
                      }}>
                        <Phone size={14} strokeWidth={2} /> {settings.outreach_number}
                      </a>
                    )}
                    <button onClick={() => onResolve(sig.id)} disabled={resolving.has(sig.id)} style={{
                      padding: '9px 20px', borderRadius: 'var(--r-full)',
                      background: resolving.has(sig.id) ? 'var(--border)' : 'var(--crisis)',
                      color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem',
                      cursor: resolving.has(sig.id) ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {resolving.has(sig.id) ? 'Resolving…' : 'Mark resolved'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resolved history */}
      {resolved.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Resolved history (last 30 days)
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            {resolved.map((sig, i) => {
              const sent     = new Date(sig.created_at)
              const resolvedAt = sig.resolved_at ? new Date(sig.resolved_at) : null
              const minutesDiff = resolvedAt ? Math.round((resolvedAt - sent) / 60000) : null
              return (
                <div key={sig.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '14px 20px',
                  borderBottom: i < resolved.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={16} strokeWidth={1.75} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {sent.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} at {sent.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {minutesDiff !== null && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Resolved in {minutesDiff < 60 ? `${minutesDiff} min` : `${Math.round(minutesDiff / 60)}h`}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--success)', background: '#DCFCE7', padding: '3px 10px', borderRadius: 'var(--r-full)' }}>
                    Resolved
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section: Analytics ────────────────────────────────────────────────
function Analytics({ dashData }) {
  if (!dashData) return <p style={{ color: 'var(--text-secondary)' }}>Loading analytics…</p>

  const { results, weekResults, prevWeekResults } = dashData
  const daily14    = groupByDay(results, 14)
  const breakdown  = computeDomainBreakdown(weekResults)
  const selfCount  = results.filter(r => r.mode === 'self').length
  const friendCount = results.filter(r => r.mode === 'friend').length
  const modeTotal  = selfCount + friendCount

  const weekTiers  = [0,1,2,3,4].map(t => ({ tier: t, curr: weekResults.filter(r => r.tier === t).length, prev: prevWeekResults.filter(r => r.tier === t).length }))

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 24px' }}>
        Campus Analytics
      </h2>

      {/* 14-day chart */}
      <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20, boxShadow: 'var(--shadow-2)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Daily check-ins — last 14 days</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Each bar = one day</div>
        <DayBars data={daily14} />
      </div>

      <div className="g-two">

        {/* Domain concern rates */}
        <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Domain concern rates</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20 }}>% of this week's screened students in moderate or above</div>
          <DomainBars breakdown={breakdown} />
        </div>

        {/* Mode split */}
        <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Check-in mode — last 30 days</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Self vs proxy (worried about a friend)</div>
          {modeTotal === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No data yet.</p> : (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                <div style={{ flex: selfCount, background: 'var(--primary)', height: 12, borderRadius: 'var(--r-full) 0 0 var(--r-full)' }} />
                <div style={{ flex: friendCount, background: 'var(--secondary)', height: 12, borderRadius: '0 var(--r-full) var(--r-full) 0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'For myself', count: selfCount, color: 'var(--primary)', icon: User },
                  { label: 'For a friend', count: friendCount, color: 'var(--secondary)', icon: Users },
                ].map(({ label, count, color, icon: Icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={16} strokeWidth={1.75} color={color} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1 }}>{label}</span>
                    <span style={{ fontWeight: 700, color, fontSize: '0.95rem' }}>{count}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>
                      {Math.round((count / modeTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Week-on-week tier comparison */}
      <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>Week-on-week tier comparison</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20 }}>This week vs previous week per tier</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {weekTiers.map(({ tier, curr, prev }) => {
            const t = weekTrend(curr, prev)
            return (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLORS[tier], flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', width: 120, flexShrink: 0 }}>{TIER_LABELS[tier]}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${weekResults.length > 0 ? (curr / weekResults.length) * 100 : 0}%`, background: TIER_COLORS[tier], borderRadius: 'var(--r-full)', transition: 'width 600ms ease' }} />
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', width: 28, textAlign: 'right', fontSize: '0.85rem', flexShrink: 0 }}>{curr}</span>
                {t.pct !== null && (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)', flexShrink: 0,
                    background: t.dir === 'down' ? '#DCFCE7' : t.dir === 'up' ? '#FEE2E2' : 'var(--border)',
                    color: t.dir === 'down' ? '#15803D' : t.dir === 'up' ? '#B91C1C' : 'var(--text-secondary)',
                  }}>
                    {t.dir === 'down' ? '↓' : t.dir === 'up' ? '↑' : '—'} {t.pct}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Section: Share ────────────────────────────────────────────────────
function SharePanel({ settings }) {
  const [appUrl, setAppUrl]  = useState(null)
  const [copied, setCopied]  = useState(false)

  useEffect(() => { setAppUrl(window.location.origin) }, [])

  const handleCopy = () => {
    if (appUrl) { navigator.clipboard.writeText(appUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        Share SABI
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 28px', lineHeight: 1.6 }}>
        Print the QR code below for hostel noticeboards, lecture halls, and common rooms. Anyone who scans it can check in anonymously — no app download needed.
      </p>

      <div className="g-share">

        {/* QR card */}
        <div style={{ padding: '32px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, boxShadow: 'var(--shadow-2)' }}>
          <div style={{ padding: 16, background: 'white', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}>
            {appUrl
              ? <QRCodeSVG value={appUrl} size={180} bgColor="transparent" level="M" />
              : <div style={{ width: 180, height: 180, background: 'var(--border)', borderRadius: 8 }} />}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>
              {settings?.campus_name || 'Campus SABI Check-in'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {appUrl ?? '—'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={handleCopy} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px', borderRadius: 'var(--r-full)',
              background: copied ? 'var(--success)' : 'var(--grad-aurora)',
              color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 200ms ease',
            }}>
              {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Poster tips */}
        <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 16 }}>
            Where to place it
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { place: 'Hostel noticeboards', why: 'High-traffic, students read them daily — highest scan rate' },
              { place: 'Lecture hall entrances', why: 'Visible to every student before and after classes' },
              { place: 'Student union building', why: 'Reaches students who are already seeking resources' },
              { place: 'Counselling centre door', why: 'Reduces stigma — anonymous option right next to the in-person one' },
              { place: 'Campus WhatsApp groups', why: 'Share the link directly — no print needed' },
            ].map(({ place, why }) => (
              <div key={place}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>{place}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{why}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_CAMPUS_BUILDINGS = [
  'Main lecture complex', 'Science / tech block', 'Faculty of arts',
  'Library', 'Hostel A', 'Hostel B', 'Hostel C', 'Hostel D',
  'Student union building', 'Sports complex', 'Chapel / Mosque',
  'Admin building', 'Medical centre', 'Outside / open area',
]

// ── Section: Settings ─────────────────────────────────────────────────
function SettingsPanel({ settings, onSave }) {
  const [draft, setDraft]           = useState(settings)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [buildings, setBuildings]   = useState([])
  const [newBuilding, setNewBuilding] = useState('')

  useEffect(() => {
    setDraft(settings)
    setBuildings(settings?.buildings?.length ? settings.buildings : DEFAULT_CAMPUS_BUILDINGS)
  }, [settings])

  const addBuilding = () => {
    const b = newBuilding.trim()
    if (!b || buildings.includes(b)) return
    setBuildings(prev => [...prev, b])
    setNewBuilding('')
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave({ ...draft, buildings })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const field = (label, hint, inputProps) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <input
        {...inputProps}
        style={{
          padding: '13px 16px', borderRadius: 'var(--r-md)',
          border: '1.5px solid var(--border)', fontSize: '1rem',
          color: 'var(--text-primary)', background: 'var(--background)',
          fontFamily: 'var(--font-body)', outline: 'none',
          transition: 'border-color 150ms ease',
        }}
      />
      {hint && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{hint}</span>}
    </label>
  )

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 24px' }}>
        Settings
      </h2>

      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Campus info */}
        <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Campus information</div>
          {field('Institution name', null, {
            type: 'text',
            value: draft?.campus_name ?? '',
            onChange: e => setDraft(p => ({ ...p, campus_name: e.target.value })),
            placeholder: 'e.g. University of Lagos',
          })}
          {field(
            'Crisis outreach number',
            'Displayed immediately to students who send a distress signal so they can call someone right away.',
            {
              type: 'tel',
              value: draft?.outreach_number ?? '',
              onChange: e => setDraft(p => ({ ...p, outreach_number: e.target.value })),
              placeholder: '+234 801 234 5678',
            }
          )}
        </div>

        {/* Buildings editor */}
        <div style={{ padding: '24px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-2)' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 4 }}>Campus buildings</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Students pick from this list when sending a distress signal so responders know exactly where to go. Add the real building names at your institution.
            </div>
          </div>

          {/* Building tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {buildings.map(b => (
              <div key={b} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 'var(--r-full)',
                background: 'var(--primary-subtle)', border: '1.5px solid var(--lavender)',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>{b}</span>
                <button onClick={() => setBuildings(prev => prev.filter(x => x !== b))} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%', border: 'none',
                  background: 'rgba(124,111,255,0.15)', cursor: 'pointer', padding: 0,
                  color: 'var(--primary)',
                }}>
                  <X size={10} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new building */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newBuilding}
              onChange={e => setNewBuilding(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBuilding()}
              placeholder="e.g. Engineering annexe"
              style={{
                flex: 1, padding: '11px 14px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', fontSize: '0.9rem',
                color: 'var(--text-primary)', background: 'var(--background)',
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <button onClick={addBuilding} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 18px', borderRadius: 'var(--r-md)',
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
            }}>
              <Plus size={14} strokeWidth={2.5} /> Add
            </button>
          </div>

          <button onClick={() => setBuildings(DEFAULT_CAMPUS_BUILDINGS)} style={{
            alignSelf: 'flex-start', background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer',
            fontFamily: 'var(--font-body)', textDecoration: 'underline', padding: 0,
          }}>
            Reset to defaults
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '13px 28px', borderRadius: 'var(--r-full)',
            background: saved ? 'var(--success)' : 'var(--grad-aurora)',
            color: '#fff', border: 'none', fontWeight: 600, fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            fontFamily: 'var(--font-body)', transition: 'background 200ms ease',
          }}
        >
          {saved ? <><Check size={16} strokeWidth={2.5} /> Saved</> : saving ? 'Saving…' : 'Save settings'}
        </button>

        {/* Privacy note */}
        <div style={{ padding: '18px 20px', borderRadius: 'var(--r-lg)', background: 'var(--primary-subtle)', border: '1px solid var(--lavender)' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: 6 }}>Privacy by design</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>
            SABI never stores student names, email addresses, or device identifiers. Distress signals contain only a timestamp and campus code. The data in this dashboard is aggregate and anonymous — no individual student can be identified.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',      Icon: LayoutDashboard },
  { id: 'alerts',    label: 'Alerts',        Icon: BellRing },
  { id: 'analytics', label: 'Analytics',     Icon: BarChart3 },
  { id: 'share',     label: 'Share',         Icon: QrCode },
  { id: 'settings',  label: 'Settings',      Icon: Settings },
]

function Sidebar({ nav, setNav, alertCount, session, onSignOut }) {
  return (
    <aside style={{
      width: 230, flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0,
      background: '#111827',
      display: 'flex', flexDirection: 'column',
      zIndex: 30,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C6FFF 0%, #A89BFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: '#fff',
            boxShadow: '0 2px 8px rgba(124,111,255,0.45)',
          }}>S</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: '#F8FAFC', letterSpacing: '-0.02em' }}>
            SABI
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', paddingLeft: 44 }}>
          Authority Dashboard
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = nav === id
          const badge  = id === 'alerts' && alertCount > 0 ? alertCount : null
          return (
            <button
              key={id}
              onClick={() => setNav(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, border: 'none',
                background: active ? 'rgba(124,111,255,0.18)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                borderLeft: active ? '3px solid #7C6FFF' : '3px solid transparent',
                transition: 'background 150ms ease',
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 1.75} color={active ? '#A89BFF' : 'rgba(255,255,255,0.45)'} />
              <span style={{ fontSize: '0.88rem', fontWeight: active ? 700 : 500, color: active ? '#F8FAFC' : 'rgba(255,255,255,0.55)', flex: 1, fontFamily: 'var(--font-body)' }}>
                {label}
              </span>
              {badge && (
                <span style={{ background: '#D9534F', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '10px 14px', marginBottom: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Signed in as</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', wordBreak: 'break-all' }}>{session?.user?.email}</div>
        </div>
        <button
          onClick={onSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 500,
            fontFamily: 'var(--font-body)', transition: 'color 150ms ease',
          }}
        >
          <LogOut size={15} strokeWidth={1.75} /> Sign out
        </button>
      </div>
    </aside>
  )
}

function MobileBottomNav({ nav, setNav, alertCount }) {
  const items = NAV_ITEMS.slice(0, 5)
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex',
      background: '#111827',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      zIndex: 30,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(({ id, label, Icon }) => {
        const active = nav === id
        const badge  = id === 'alerts' && alertCount > 0 ? alertCount : null
        return (
          <button key={id} onClick={() => setNav(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer',
            position: 'relative',
          }}>
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} color={active ? '#A89BFF' : 'rgba(255,255,255,0.4)'} />
            <span style={{ fontSize: '0.6rem', color: active ? '#A89BFF' : 'rgba(255,255,255,0.4)', fontWeight: active ? 700 : 400, fontFamily: 'var(--font-body)' }}>
              {label}
            </span>
            {badge && (
              <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(8px)', background: '#D9534F', color: '#fff', borderRadius: 99, padding: '0px 5px', fontSize: '0.6rem', fontWeight: 700 }}>
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function AuthorityPage() {
  const router = useRouter()
  const [loading, setLoading]           = useState(true)
  const [session, setSession]           = useState(null)
  const [nav, setNav]                   = useState('overview')
  const [signals, setSignals]           = useState([])
  const [dashData, setDashData]         = useState(null)
  const [settings, setSettings]         = useState({ outreach_number: '', campus_name: '' })
  const [resolving, setResolving]       = useState(new Set())
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [refreshing, setRefreshing]     = useState(false)
  const prevAlertCount                  = useRef(0)

  const loadSignals = useCallback(async () => {
    try {
      const data = await fetchDistressSignals()
      const active = data.filter(s => !s.resolved)
      if (active.length > prevAlertCount.current) {
        playAlertTone()
        if ('vibrate' in navigator) navigator.vibrate([300, 150, 300])
      }
      prevAlertCount.current = active.length
      setSignals(data)
    } catch {}
  }, [])

  const loadDashboard = useCallback(async () => {
    setRefreshing(true)
    try {
      const [data, cfg] = await Promise.all([
        fetchDashboardData(),
        fetchAuthoritySettings(),
      ])
      setDashData(data)
      if (cfg) setSettings(cfg)
      setLastRefreshed(new Date())
    } catch {}
    setRefreshing(false)
  }, [])

  useEffect(() => {
    getAuthorityClient().auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/authority/login'); return }
      setSession(s)
      Promise.all([loadSignals(), loadDashboard()]).finally(() => setLoading(false))
    })
  }, [router, loadSignals, loadDashboard])

  // Poll alerts every 10 s
  useEffect(() => {
    if (!session) return
    const id = setInterval(loadSignals, 10_000)
    return () => clearInterval(id)
  }, [session, loadSignals])

  const handleResolve = async (id) => {
    setResolving(prev => new Set([...prev, id]))
    try {
      await resolveSignal(id)
      setSignals(prev => prev.map(s => s.id === id ? { ...s, resolved: true, resolved_at: new Date().toISOString() } : s))
      prevAlertCount.current = Math.max(0, prevAlertCount.current - 1)
    } finally {
      setResolving(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleSaveSettings = async (draft) => {
    await updateAuthoritySettings(draft)
    setSettings(draft)
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/authority/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard…</p>
      </div>
    )
  }

  const activeAlertCount = signals.filter(s => !s.resolved).length

  return (
    <>
      <style>{`
        .auth-layout { display: flex; min-height: 100dvh; background: var(--background); }
        .auth-sidebar { display: flex; }
        .auth-main { margin-left: 230px; flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .auth-content { flex: 1; padding: 40px 40px 80px; width: 100%; box-sizing: border-box; }
        .auth-mobile-nav { display: none; }

        /* Grid systems — consistent across all tabs */
        .g-kpi  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .g-kpi3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .g-charts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }
        .g-two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 24px; }
        .g-share { display: grid; grid-template-columns: 400px 1fr; gap: 24px; }

        /* Tablet (≤1100px): collapse some grids */
        @media (max-width: 1100px) {
          .g-kpi  { grid-template-columns: repeat(2, 1fr); }
          .g-charts { grid-template-columns: repeat(2, 1fr); }
          .g-share { grid-template-columns: 1fr; }
        }
        /* Tablet/sidebar break (≤768px): go mobile */
        @media (max-width: 768px) {
          .auth-sidebar { display: none; }
          .auth-main { margin-left: 0; }
          .auth-content { padding: 20px 16px 100px; }
          .auth-mobile-nav { display: flex; }
          .g-kpi  { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .g-kpi3 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .g-charts { grid-template-columns: 1fr; }
          .g-two { grid-template-columns: 1fr; }
          .g-share { grid-template-columns: 1fr; }
        }
        @media (max-width: 400px) {
          .g-kpi  { grid-template-columns: 1fr; }
          .g-kpi3 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-layout">
        <div className="auth-sidebar">
          <Sidebar nav={nav} setNav={setNav} alertCount={activeAlertCount} session={session} onSignOut={handleSignOut} />
        </div>

        <main className="auth-main">
          <div className="auth-content">
            {nav === 'overview'  && <Overview dashData={dashData} signals={signals} lastRefreshed={lastRefreshed} onRefresh={loadDashboard} refreshing={refreshing} />}
            {nav === 'alerts'    && <AlertsPanel signals={signals} onResolve={handleResolve} resolving={resolving} settings={settings} />}
            {nav === 'analytics' && <Analytics dashData={dashData} />}
            {nav === 'share'     && <SharePanel settings={settings} />}
            {nav === 'settings'  && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}
          </div>
        </main>

        <div className="auth-mobile-nav">
          <MobileBottomNav nav={nav} setNav={setNav} alertCount={activeAlertCount} />
        </div>
      </div>
    </>
  )
}
