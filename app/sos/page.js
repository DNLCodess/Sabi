'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LifeBuoy, Phone, ArrowLeft, CheckCircle2, MapPin, Loader2, WifiOff, Navigation2 } from 'lucide-react'
import HoldButton from '@/components/HoldButton'
import ProfileOptIn from '@/components/ProfileOptIn'
import { sendDistressSignal, fetchOutreachSettings } from '@/lib/supabase'
import { getStoredProfileId, getProfile, buildScreeningSnapshot } from '@/lib/profile'

const DEFAULT_BUILDINGS = [
  'Main lecture complex', 'Science / tech block', 'Faculty of arts',
  'Library', 'Hostel A', 'Hostel B', 'Hostel C', 'Hostel D',
  'Student union building', 'Sports complex', 'Chapel / Mosque',
  'Admin building', 'Medical centre', 'Outside / open area',
]

const URGENCY_LEVELS = [
  { id: 'low',    label: "I'm feeling off, not urgent",          sub: 'Want some resources to look through',            color: 'var(--primary)',  border: 'var(--border)' },
  { id: 'medium', label: "I'm struggling and need support soon", sub: 'Could use someone to talk to',                   color: 'var(--warning)',  border: 'var(--warning-soft)' },
  { id: 'high',   label: 'I need help right now',                sub: 'Send a private signal to campus support',        color: 'var(--crisis)',   border: 'var(--crisis)' },
]

// ── Location helpers ──────────────────────────────────────────────────
function AccuracyBadge({ accuracy_m }) {
  if (!accuracy_m) return null
  const [color, label] =
    accuracy_m < 25  ? ['#15803D', `±${accuracy_m}m · Precise`]
    : accuracy_m < 100 ? ['#B7791F', `±${accuracy_m}m · Approximate`]
    :                    ['#B91C1C', `±${accuracy_m}m · Rough area`]
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 'var(--r-full)' }}>
      {label}
    </span>
  )
}

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=18`
}

function w3wUrl(lat, lng, words) {
  return words ? `https://what3words.com/${words}` : `https://what3words.com/map?coordinates=${lat},${lng}`
}

// ── Main page ─────────────────────────────────────────────────────────
export default function SOSPage() {
  const [level, setLevel]           = useState(null)
  const [sent, setSent]             = useState(false)
  const [sending, setSending]       = useState(false)
  const [settings, setSettings]     = useState({ outreach_number: null, buildings: [] })

  // Location
  const [location, setLocation]     = useState(null)   // { lat, lng, accuracy_m }
  const [locStatus, setLocStatus]   = useState('idle') // idle | loading | found | denied
  const [w3w, setW3W]               = useState(null)

  // Student input
  const [building, setBuilding]     = useState(null)
  const [note, setNote]             = useState('')

  // Profile state — checked once when high urgency selected
  const [profile, setProfile]       = useState(null)   // null = not loaded yet; false = no profile
  const [profileLoaded, setProfileLoaded] = useState(false)

  const handleLevelSelect = (id) => {
    setLevel(id)
    if (id !== 'high') return

    // Fetch settings (outreach number + building list) in background
    fetchOutreachSettings().then(s => setSettings(s))

    // Load profile state so we know whether to show the SOS nudge
    getProfile().then(p => { setProfile(p ?? false); setProfileLoaded(true) })

    // Start location capture immediately so it's ready before they hold the button
    setLocStatus('loading')
    if (!('geolocation' in navigator)) { setLocStatus('denied'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy_m: Math.round(pos.coords.accuracy) })
        setLocStatus('found')
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // What3Words lookup — fires once location is confirmed
  useEffect(() => {
    if (locStatus !== 'found' || !location) return
    const key = process.env.NEXT_PUBLIC_W3W_API_KEY
    if (!key) return
    fetch(`https://api.what3words.com/v3/convert-to-3wa?coordinates=${location.lat},${location.lng}&language=en&key=${key}`)
      .then(r => r.json())
      .then(d => { if (d.words) setW3W(d.words) })
      .catch(() => {})
  }, [locStatus, location])

  const handleDistress = async () => {
    setSending(true)
    const linkedProfile = profile || null
    await sendDistressSignal({
      building:            building ?? null,
      lat:                 location?.lat ?? null,
      lng:                 location?.lng ?? null,
      gps_accuracy_m:      location?.accuracy_m ?? null,
      contact_phone:       linkedProfile?.phone ?? null,
      contact_name:        linkedProfile?.full_name ?? null,
      profile_id:          linkedProfile?.id ?? null,
      screening_snapshot:  buildScreeningSnapshot(),
    })
    setSent(true)
    setSending(false)
  }

  const buildings = settings.buildings?.length ? settings.buildings : DEFAULT_BUILDINGS

  // ── Confirmation ──────────────────────────────────────────────────
  if (sent) {
    return (
      <main style={{ minHeight: '100dvh', background: '#FEF2F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ maxWidth: 420, textAlign: 'center', width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 4px 24px rgba(217,83,79,0.2)' }}>
            <LifeBuoy size={36} strokeWidth={1.5} color="var(--crisis)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: '#B91C1C', margin: '0 0 12px' }}>
            Help is on the way.
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 6px' }}>
            Your campus support team has been notified <strong>anonymously</strong>.
          </p>
          {building && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 6px' }}>
              Your location ({building}{location ? `, ±${location.accuracy_m}m` : ''}) was shared with responders.
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 28px', fontSize: '0.9rem' }}>
            Please stay in a visible place. If you can, keep your phone with you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {settings.outreach_number && (
              <a href={`tel:${settings.outreach_number.replace(/[\s\-()]/g, '')}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px 20px', borderRadius: 'var(--r-full)',
                background: 'var(--crisis)', color: '#fff',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none',
              }}>
                <Phone size={20} strokeWidth={2} />
                Call campus support: {settings.outreach_number}
              </a>
            )}
            <a href="tel:08008002000" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 20px', borderRadius: 'var(--r-full)',
              background: settings.outreach_number ? 'var(--surface)' : 'var(--crisis)',
              border: settings.outreach_number ? '1.5px solid var(--crisis)' : 'none',
              color: settings.outreach_number ? 'var(--crisis)' : '#fff',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none',
            }}>
              <Phone size={20} strokeWidth={2} />
              MANI Crisis Line · 0800 800 2000
            </a>
          </div>
          <Link href="/" style={{ display: 'block', marginTop: 28, fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}>
            Return to home
          </Link>
        </div>
      </main>
    )
  }

  // ── Main layout ───────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%', padding: '24px 20px 100px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Link href="/" aria-label="Back" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, minWidth: 44, borderRadius: 'var(--r-full)',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            color: 'var(--text-secondary)', textDecoration: 'none',
          }}>
            <ArrowLeft size={20} strokeWidth={1.75} />
          </Link>
          <Image src="/logo.png" alt="SABI" width={72} height={24} style={{ objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.2 }}>
          How urgent is this for you?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 32px', lineHeight: 1.6 }}>
          No one can see what you pick. Be honest — it helps us respond correctly.
        </p>

        {/* ── Level picker ── */}
        {!level && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {URGENCY_LEVELS.map(({ id, label, sub, border }) => (
              <button key={id} onClick={() => handleLevelSelect(id)} style={{
                textAlign: 'left', padding: '20px 22px', borderRadius: 'var(--r-xl)',
                background: 'var(--surface)', border: `2px solid ${border}`,
                cursor: 'pointer', width: '100%', transition: 'transform 100ms ease',
              }}>
                <div style={{ fontWeight: 700, color: id === 'high' ? 'var(--crisis)' : id === 'medium' ? 'var(--warning)' : 'var(--text-primary)', fontSize: '0.98rem', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* ── Low / medium: resources ── */}
        {(level === 'low' || level === 'medium') && (
          <div>
            <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20 }}>
              <p style={{ margin: '0 0 20px', color: 'var(--text-primary)', lineHeight: 1.75, fontSize: '1rem' }}>
                {level === 'low'
                  ? "That's okay. Here are some things that might help right now."
                  : "It takes courage to acknowledge this. Please reach out — you don't have to handle this alone."}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="tel:08008002000" style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                  borderRadius: 'var(--r-full)', background: 'var(--primary)', color: '#fff',
                  fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
                }}>
                  <Phone size={18} strokeWidth={2} /> MANI Crisis Line · 0800 800 2000 (free)
                </a>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                  borderRadius: 'var(--r-full)', background: 'var(--primary-subtle)',
                  border: '1px solid var(--lavender)', color: 'var(--primary)', fontSize: '0.9rem',
                  fontWeight: 500, fontFamily: 'var(--font-body)',
                }}>
                  <CheckCircle2 size={18} strokeWidth={1.75} />
                  Counselling Centre · Student Affairs · Mon–Fri 8am–4pm
                </div>
              </div>
            </div>
            <button onClick={() => setLevel(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-body)', padding: '8px 0' }}>
              Back
            </button>
          </div>
        )}

        {/* ── High: location + building + note + hold button ── */}
        {level === 'high' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* What happens */}
            <div style={{ padding: '22px', borderRadius: 'var(--r-xl)', background: '#FEF2F2', border: '2px solid var(--crisis)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#B91C1C', margin: '0 0 10px' }}>
                What happens when you send a signal
              </h2>
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  'Your campus support team gets an anonymous alert',
                  'Your location and building are shared so they can reach you fast',
                  'No name, student ID, or personal info is ever sent',
                  "You'll see a direct number to call while they respond",
                ].map((p, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Profile nudge — always shown if no profile, non-dismissible */}
            {profileLoaded && !profile && (
              <ProfileOptIn
                variant="sos"
                onLinked={() => getProfile().then(p => setProfile(p ?? false))}
              />
            )}

            {/* Profile linked confirmation */}
            {profileLoaded && profile && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'rgba(21,128,61,0.07)', border: '1.5px solid #86EFAC',
              }}>
                <CheckCircle2 size={16} color="#15803D" strokeWidth={2} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#15803D' }}>
                  Profile linked — your team will have your contact details.
                </span>
              </div>
            )}

            {/* Location status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', borderRadius: 'var(--r-xl)',
              background: locStatus === 'found' ? '#F0FDF4' : locStatus === 'denied' ? '#FEF9EC' : 'var(--surface)',
              border: `1.5px solid ${locStatus === 'found' ? '#86EFAC' : locStatus === 'denied' ? '#FCD34D' : 'var(--border)'}`,
            }}>
              {locStatus === 'loading' && <Loader2 size={18} strokeWidth={2} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
              {locStatus === 'found'   && <MapPin   size={18} strokeWidth={2} color="#15803D" style={{ flexShrink: 0 }} />}
              {locStatus === 'denied'  && <WifiOff  size={18} strokeWidth={2} color="#B7791F" style={{ flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: locStatus === 'found' ? '#15803D' : locStatus === 'denied' ? '#B7791F' : 'var(--text-primary)' }}>
                  {locStatus === 'loading' && 'Finding your location…'}
                  {locStatus === 'found'   && 'Location found — ready to send'}
                  {locStatus === 'denied'  && 'Location unavailable — pick your building below'}
                </div>
                {locStatus === 'found' && location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <AccuracyBadge accuracy_m={location.accuracy_m} />
                    {w3w && <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>///{w3w}</span>}
                  </div>
                )}
                {locStatus === 'denied' && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    Your building choice is what responders will follow.
                  </div>
                )}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Building picker */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 10 }}>
                Where are you right now?{locStatus === 'found' ? ' (confirms location)' : ' '}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {buildings.map(b => (
                  <button key={b} onClick={() => setBuilding(b === building ? null : b)} style={{
                    padding: '11px 14px', borderRadius: 'var(--r-lg)', textAlign: 'left',
                    border: `2px solid ${building === b ? 'var(--crisis)' : 'var(--border)'}`,
                    background: building === b ? '#FEF2F2' : 'var(--surface)',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem', fontWeight: building === b ? 700 : 500,
                    color: building === b ? '#B91C1C' : 'var(--text-primary)',
                    transition: 'all 100ms ease',
                  }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Note for responders <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 120))}
                  placeholder="e.g. 2nd floor bathroom, wearing red hoodie"
                  rows={2}
                  style={{
                    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                    borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)',
                    fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                    color: 'var(--text-primary)', background: 'var(--surface)',
                    resize: 'none', outline: 'none', lineHeight: 1.5,
                  }}
                />
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {note.length}/120
                </span>
              </div>
            </div>

            {/* Hold button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: 0 }}>
                {sending ? 'Sending…' : 'Hold for 3 seconds to send signal'}
              </p>
              <HoldButton onComplete={handleDistress} label="Hold 3s" duration={3000} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
                {locStatus === 'found'
                  ? `Your location (±${location?.accuracy_m}m) ${building ? `and building (${building})` : ''} will be sent to campus support.`
                  : building
                    ? `Your building (${building}) will be sent to campus support.`
                    : 'Pick a building above so responders can find you faster.'}
              </p>
            </div>

            {/* MANI fallback */}
            <a href="tel:08008002000" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '15px 20px', borderRadius: 'var(--r-full)',
              background: 'var(--crisis)', color: '#fff',
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none', fontFamily: 'var(--font-body)',
            }}>
              <Phone size={18} strokeWidth={2} />
              Or call MANI now: 0800 800 2000
            </a>

            <button onClick={() => { setLevel(null); setBuilding(null); setNote('') }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'var(--font-body)', padding: '4px 0' }}>
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
