import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client = null

// Separate client instance from the anonymous student client:
// - persistSession: true so authority staff stay logged in
// - storageKey isolated so student sessions are never touched
export function getAuthorityClient() {
  if (!_client) _client = createClient(url, anon, {
    auth: { persistSession: true, storageKey: 'sabi-authority' },
  })
  return _client
}

export async function signIn(email, password) {
  return getAuthorityClient().auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return getAuthorityClient().auth.signOut()
}

export async function getAuthoritySession() {
  const { data: { session } } = await getAuthorityClient().auth.getSession()
  return session
}

export async function fetchDistressSignals() {
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data, error } = await getAuthorityClient()
    .from('sabi_distress_signals')
    .select('id, created_at, campus_code, resolved, resolved_at, building, lat, lng, gps_accuracy_m, contact_phone, contact_name, profile_id, screening_snapshot')
    .gte('created_at', monthAgo)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function resolveSignal(id) {
  const { error } = await getAuthorityClient()
    .from('sabi_distress_signals')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function fetchAuthoritySettings() {
  const { data } = await getAuthorityClient()
    .from('sabi_authority_settings')
    .select('outreach_number, campus_name, buildings')
    .eq('id', 1)
    .maybeSingle()
  return data
}

export async function updateAuthoritySettings({ outreach_number, campus_name, buildings }) {
  const { error } = await getAuthorityClient()
    .from('sabi_authority_settings')
    .upsert({ id: 1, outreach_number, campus_name, buildings: buildings ?? [], updated_at: new Date().toISOString() })
  if (error) throw error
}

/**
 * Single comprehensive fetch for the dashboard.
 * Pulls 30 days of results + 30 days of distress signals + all-time count in parallel.
 * Returns raw rows — the page derives all charts and KPIs client-side.
 */
export async function fetchDashboardData() {
  const client = getAuthorityClient()
  const DAY = 86_400_000
  const now  = Date.now()

  const monthAgo = new Date(now - 30 * DAY).toISOString()
  const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [resultsRes, distressRes, totalRes] = await Promise.all([
    client
      .from('sabi_results')
      .select('tier, mode, phq9_band, gad7_band, pss10_band, cbi_band, created_at')
      .gte('created_at', monthAgo)
      .order('created_at', { ascending: false }),

    client
      .from('sabi_distress_signals')
      .select('id, created_at, resolved, resolved_at, building, lat, lng, gps_accuracy_m, contact_phone, contact_name, profile_id, screening_snapshot')
      .gte('created_at', monthAgo)
      .order('created_at', { ascending: false }),

    client
      .from('sabi_results')
      .select('id', { count: 'exact', head: true }),
  ])

  const results = resultsRes.data ?? []
  const distress = distressRes.data ?? []
  const total    = totalRes.count ?? 0

  const DAY_MS = DAY
  const weekAgo     = new Date(now - 7  * DAY_MS).toISOString()
  const prevWeekAgo = new Date(now - 14 * DAY_MS).toISOString()

  return {
    total,
    results,                          // last 30 days, full rows
    distress,                         // last 30 days distress signals
    weekResults:     results.filter(r => r.created_at >= weekAgo),
    prevWeekResults: results.filter(r => r.created_at >= prevWeekAgo && r.created_at < weekAgo),
    todayResults:    results.filter(r => r.created_at >= todayMidnight),
  }
}
