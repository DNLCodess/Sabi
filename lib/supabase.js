import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client = null
function getClient() {
  if (!_client) _client = createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: true,
      storageKey: 'sabi-student', // isolated from authority session
    },
  })
  return _client
}

// ── Anonymous auth ────────────────────────────────────────────────────
// Ensures every student has a stable anonymous JWT (via Supabase anonymous auth).
// Called once on app boot. Gives us auth.uid() in RLS without requiring login.
let _anonInitPromise = null
export function ensureAnonSession() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (_anonInitPromise) return _anonInitPromise
  _anonInitPromise = (async () => {
    const { data: { session } } = await getClient().auth.getSession()
    if (!session) {
      await getClient().auth.signInAnonymously()
    }
  })()
  return _anonInitPromise
}

export function getStudentClient() {
  return getClient()
}

// ── Offline queue ─────────────────────────────────────────────────────
const QUEUE_KEY = 'sabi_pending_pushes'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}
function saveQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch {}
}

// ── Aggregate results (anonymous) ────────────────────────────────────
export async function pushAggregateResult({ tier, mode, domains }) {
  const row = {
    tier,
    mode,
    phq9_band:  domains.find(d => d.name === 'phq9')?.band  ?? null,
    gad7_band:  domains.find(d => d.name === 'gad7')?.band  ?? null,
    pss10_band: domains.find(d => d.name === 'pss10')?.band ?? null,
    cbi_band:   domains.find(d => d.name === 'cbi')?.band   ?? null,
  }

  try {
    const { error } = await getClient().from('sabi_results').insert(row)
    if (error) throw error
    flushQueue()
  } catch {
    const q = loadQueue()
    q.push(row)
    saveQueue(q)
  }
}

async function flushQueue() {
  const q = loadQueue()
  if (!q.length) return
  try {
    const { error } = await getClient().from('sabi_results').insert(q)
    if (!error) saveQueue([])
  } catch {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushQueue)
}

// ── Distress signals ──────────────────────────────────────────────────
export async function sendDistressSignal({
  campusCode = 'MAIN',
  building = null,
  lat = null,
  lng = null,
  gps_accuracy_m = null,
  contact_phone = null,
  contact_name = null,
  profile_id = null,
  screening_snapshot = null,
} = {}) {
  try {
    const client = getClient()
    const { data: { session } } = await client.auth.getSession()
    const { error } = await client.from('sabi_distress_signals').insert({
      campus_code: campusCode,
      building,
      lat,
      lng,
      gps_accuracy_m,
      contact_phone,
      contact_name,
      profile_id,
      screening_snapshot,
      user_id: session?.user?.id ?? null,
    })
    if (error) throw error
    return true
  } catch {
    return false
  }
}

// ── Outreach settings ─────────────────────────────────────────────────
export async function fetchOutreachSettings() {
  try {
    const { data } = await getClient()
      .from('sabi_authority_settings')
      .select('outreach_number, campus_name')
      .eq('id', 1)
      .maybeSingle()
    return {
      outreach_number: data?.outreach_number ?? null,
      campus_name:     data?.campus_name ?? null,
      buildings:       [],
    }
  } catch {
    return { outreach_number: null, campus_name: null, buildings: [] }
  }
}

/** @deprecated use fetchOutreachSettings */
export async function fetchOutreachNumber() {
  const { outreach_number } = await fetchOutreachSettings()
  return outreach_number
}

// ── Admin heatmap stats ───────────────────────────────────────────────
export async function fetchHeatmapStats() {
  const client = getClient()

  const [totalRes, weekRes, tierRes] = await Promise.all([
    client.from('sabi_results').select('id', { count: 'exact', head: true }),
    client.from('sabi_results').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    client.from('sabi_results').select('tier'),
  ])

  const rows = tierRes.data ?? []
  const total = totalRes.count ?? 0
  const weekTotal = weekRes.count ?? 0

  const tierCounts = [0, 1, 2, 3, 4].map(t => ({
    tier: t,
    count: rows.filter(r => r.tier === t).length,
  }))

  const moderatePlus = rows.filter(r => r.tier >= 2).length
  const moderatePct = total > 0 ? Math.round((moderatePlus / total) * 100) : 0

  return { total, weekTotal, tierCounts, moderatePlus, moderatePct }
}
