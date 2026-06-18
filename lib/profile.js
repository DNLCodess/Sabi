import { getStudentClient } from './supabase'

const PROFILE_KEY    = 'sabi_profile_id'
const CHECKIN_COUNT  = 'sabi_checkin_count'

// ── Local helpers ─────────────────────────────────────────────────────

export function getStoredProfileId() {
  try { return localStorage.getItem(PROFILE_KEY) } catch { return null }
}

function storeProfileId(id) {
  try { localStorage.setItem(PROFILE_KEY, id) } catch {}
}

function clearStoredProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch {}
}

export function incrementCheckinCount() {
  try {
    const n = parseInt(localStorage.getItem(CHECKIN_COUNT) ?? '0', 10)
    localStorage.setItem(CHECKIN_COUNT, String(n + 1))
    return n + 1
  } catch { return 0 }
}

export function getCheckinCount() {
  try { return parseInt(localStorage.getItem(CHECKIN_COUNT) ?? '0', 10) } catch { return 0 }
}

// ── Profile operations ────────────────────────────────────────────────

/**
 * Create a profile for the current anonymous user.
 * Stores the resulting profile ID in localStorage for future sessions.
 */
export async function createProfile({ matricNumber, phone, fullName = null, campusCode = 'MAIN' }) {
  const client = getStudentClient()
  const { data: { session } } = await client.auth.getSession()
  if (!session) throw new Error('No anonymous session — call ensureAnonSession first')

  const { data, error } = await client
    .from('sabi_profiles')
    .insert({
      user_id:          session.user.id,
      matric_number:    matricNumber,
      phone,
      full_name:        fullName || null,
      consent_given_at: new Date().toISOString(),
      consent_version:  'v1',
      campus_code:      campusCode,
    })
    .select('id')
    .single()

  if (error) throw error
  storeProfileId(data.id)
  return data.id
}

/**
 * Fetch the student's own profile row (requires stored profile ID).
 * Returns null if no profile is linked on this device.
 */
export async function getProfile() {
  const profileId = getStoredProfileId()
  if (!profileId) return null

  const { data, error } = await getStudentClient()
    .from('sabi_profiles')
    .select('id, matric_number, phone, full_name, campus_code, consent_given_at, active')
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data || !data.active) return null
  return data
}

/**
 * Unlink the profile on this device.
 * Sets active = false in the database and clears local storage.
 * This anonymises the student — their check-in history is retained but
 * the profile row is deactivated and contact info is no longer accessible.
 */
export async function unlinkProfile() {
  const profileId = getStoredProfileId()
  if (!profileId) return

  await getStudentClient()
    .from('sabi_profiles')
    .update({ active: false })
    .eq('id', profileId)

  clearStoredProfile()
}

// ── Check-in history ──────────────────────────────────────────────────

/**
 * Push a single check-in result to sabi_checkin_history.
 * Only called when the student has an active profile.
 * Raw answers never leave the device — only the computed tier + bands.
 */
export async function pushCheckinHistory({ tier, mode, domains }) {
  const profileId = getStoredProfileId()
  const client    = getStudentClient()
  const { data: { session } } = await client.auth.getSession()
  if (!session) return

  const row = {
    user_id:    session.user.id,
    profile_id: profileId ?? null,
    tier,
    mode,
    phq9_band:  domains.find(d => d.name === 'phq9')?.band  ?? null,
    gad7_band:  domains.find(d => d.name === 'gad7')?.band  ?? null,
    pss10_band: domains.find(d => d.name === 'pss10')?.band ?? null,
    cbi_band:   domains.find(d => d.name === 'cbi')?.band   ?? null,
  }

  try {
    const { error } = await client.from('sabi_checkin_history').insert(row)
    if (error) console.warn('checkin history push failed:', error.message)
  } catch {}
}

/**
 * Fetch the student's own check-in history (last 90 days).
 * Used on the profile page to show their trend.
 */
export async function fetchOwnHistory() {
  const client  = getStudentClient()
  const { data: { session } } = await client.auth.getSession()
  if (!session) return []

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const { data } = await client
    .from('sabi_checkin_history')
    .select('created_at, tier, mode, phq9_band, gad7_band, pss10_band, cbi_band')
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: true })

  return data ?? []
}

/**
 * Build the screening_snapshot object to attach to a distress signal.
 * Pulled from the most recent sabi_result in sessionStorage.
 */
export function buildScreeningSnapshot() {
  try {
    const result = JSON.parse(sessionStorage.getItem('sabi_result') ?? 'null')
    if (!result) return null
    return {
      tier:       result.overall_tier,
      mode:       result.mode,
      phq9_band:  result.domains?.find(d => d.name === 'phq9')?.band  ?? null,
      gad7_band:  result.domains?.find(d => d.name === 'gad7')?.band  ?? null,
      pss10_band: result.domains?.find(d => d.name === 'pss10')?.band ?? null,
      cbi_band:   result.domains?.find(d => d.name === 'cbi')?.band   ?? null,
    }
  } catch { return null }
}
