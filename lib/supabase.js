import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client = null
function getClient() {
  if (!_client) _client = createClient(supabaseUrl, supabaseAnon)
  return _client
}

/**
 * Fire-and-forget: push only aggregate, anonymous tier+band counts.
 * Errors are logged but never surfaced to the user.
 */
export async function pushAggregateResult({ tier, mode, domains }) {
  try {
    const row = {
      tier,
      mode,
      phq9_band:  domains.find(d => d.name === 'phq9')?.band  ?? null,
      gad7_band:  domains.find(d => d.name === 'gad7')?.band  ?? null,
      pss10_band: domains.find(d => d.name === 'pss10')?.band ?? null,
      cbi_band:   domains.find(d => d.name === 'cbi')?.band   ?? null,
    }
    await getClient().from('sabi_results').insert(row)
  } catch (err) {
    console.error('[SABI] pushAggregateResult failed silently:', err)
  }
}

/**
 * Fetch aggregate stats for the admin dashboard.
 * Returns counts grouped by tier + this-week totals.
 */
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
