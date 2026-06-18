import { getMicroIntervention } from './microInterventions.js'
import { RESOURCES } from './resources.js'

// ── Scoring ──────────────────────────────────────────────────────────

export function scorePHQ9(answers) {
  const score = answers.reduce((s, v) => s + (v ?? 0), 0)
  const safetyTriggered = (answers[8] ?? 0) > 0
  return { score, band: phq9Band(score), weight: phq9Weight(score), safetyTriggered }
}

export function scoreGAD7(answers) {
  const score = answers.reduce((s, v) => s + (v ?? 0), 0)
  return { score, band: gad7Band(score), weight: gad7Weight(score) }
}

export function scorePSS10(answers) {
  // Reverse-score items at 1-indexed positions 4,5,7,8 (0-indexed: 3,4,6,7)
  const reverseIndexes = new Set([3, 4, 6, 7])
  const score = answers.reduce((s, v, i) => {
    const val = reverseIndexes.has(i) ? 4 - (v ?? 0) : (v ?? 0)
    return s + val
  }, 0)
  return { score, band: pss10Band(score), weight: pss10Weight(score) }
}

export function scoreCBI(answers) {
  const valid = answers.filter(v => v != null)
  if (valid.length < 3) return { score: null, band: null, weight: null }
  const score = Math.round(valid.reduce((s, v) => s + v, 0) / valid.length)
  return { score, band: cbiBand(score), weight: cbiWeight(score) }
}

// ── Band helpers ─────────────────────────────────────────────────────

function phq9Band(s) {
  if (s <= 4)  return 'Minimal'
  if (s <= 9)  return 'Mild'
  if (s <= 14) return 'Moderate'
  if (s <= 19) return 'Moderately severe'
  return 'Severe'
}
function phq9Weight(s) {
  if (s <= 4)  return 0
  if (s <= 9)  return 1
  if (s <= 14) return 2
  if (s <= 19) return 3
  return 4
}

function gad7Band(s) {
  if (s <= 4)  return 'Minimal'
  if (s <= 9)  return 'Mild'
  if (s <= 14) return 'Moderate'
  return 'Severe'
}
function gad7Weight(s) {
  if (s <= 4)  return 0
  if (s <= 9)  return 1
  if (s <= 14) return 2
  if (s === 15) return 3
  return 4  // 16-21 → Severe
}

function pss10Band(s) {
  if (s <= 13) return 'Low'
  if (s <= 26) return 'Moderate'
  return 'High'
}
function pss10Weight(s) {
  if (s <= 13) return 0
  if (s <= 18) return 1
  if (s <= 26) return 2
  if (s <= 34) return 3
  return 4
}

function cbiBand(s) {
  if (s < 25)  return 'Low'
  if (s < 50)  return 'Low-moderate'
  if (s < 75)  return 'Moderate'
  if (s < 100) return 'High'
  return 'Severe'
}
function cbiWeight(s) {
  if (s < 25)  return 0
  if (s < 50)  return 1
  if (s < 75)  return 2
  if (s < 100) return 3
  return 4
}

// ── SABI message templates ────────────────────────────────────────────

const SABI_SELF = [
  'You dey hold up well. Keep doing the things that help you.',
  'You seem to be under more pressure than usual lately. Nothing alarming — but let\'s look at a few things that help.',
  'What you shared points to a real strain. Talking to someone could help — and it\'s free and private.',
  'This is a heavy load to carry alone. I\'d really encourage you to speak to a counsellor soon.',
  'I\'m really glad you shared this. Your safety matters most — please reach out to one of these right now. You don\'t have to handle this alone.',
]

const SABI_FRIEND = [
  'Your friend seems to be doing okay from what you\'ve described. Keep showing up for them.',
  'It sounds like your friend might be under more pressure than usual. Here are some things that could help them.',
  'What you\'ve shared suggests your friend is carrying a real strain. Encouraging them to talk to someone could make a real difference.',
  'Your friend may be carrying a heavy load right now. Gently encouraging professional support could really help.',
  'This is urgent. Please don\'t leave your friend alone right now — help them reach out to one of these resources immediately.',
]

// ── Main engine ──────────────────────────────────────────────────────

/**
 * @param {Object} domainResults - { phq9?: answers[], gad7?: answers[], pss10?: answers[], cbi?: answers[] }
 * @param {'self'|'friend'} mode
 * @returns {EngineOutput}
 */
export function runEngine(domainResults, mode = 'self') {
  const scored = {}
  const domains = []

  if (domainResults.phq9) {
    scored.phq9 = scorePHQ9(domainResults.phq9)
    domains.push({ name: 'phq9', label: 'Low mood', ...scored.phq9 })
  }
  if (domainResults.gad7) {
    scored.gad7 = scoreGAD7(domainResults.gad7)
    domains.push({ name: 'gad7', label: 'Anxiety', ...scored.gad7 })
  }
  if (domainResults.pss10) {
    scored.pss10 = scorePSS10(domainResults.pss10)
    domains.push({ name: 'pss10', label: 'Stress', ...scored.pss10 })
  }
  if (domainResults.cbi) {
    scored.cbi = scoreCBI(domainResults.cbi)
    if (scored.cbi.weight != null) {
      domains.push({ name: 'cbi', label: 'Burnout', ...scored.cbi })
    }
  }

  // 1. Safety override
  const safetyTriggered = scored.phq9?.safetyTriggered ?? false
  if (safetyTriggered) {
    return buildOutput({ overall_tier: 4, safetyTriggered: true, domains, firedRules: ['Safety: You shared thoughts of self-harm or being better off dead — your wellbeing is the top priority right now.'], mode })
  }

  // 2. Base tier
  const weights = domains.map(d => d.weight).filter(w => w != null)
  let tier = weights.length ? Math.max(...weights) : 0

  // 3. Pattern rules
  const firedRules = []

  // R1: Burnout-driven low mood
  if ((scored.cbi?.weight ?? 0) >= 2 && (scored.phq9?.weight ?? 0) >= 2) {
    tier = Math.min(4, tier + 1)
    firedRules.push('R1: High exhaustion alongside low mood — burnout and depression often overlap.')
  }

  // R2: Anxious-stress load
  if ((scored.pss10?.score ?? 0) >= 27 && (scored.gad7?.score ?? 0) >= 10) {
    tier = Math.min(4, tier + 1)
    firedRules.push('R2: High stress plus anxiety symptoms — your system is carrying a heavy load.')
  }

  // R3: Functional impairment (GAD-7 + PHQ-9 sleep/energy/focus)
  const phq9Answers = domainResults.phq9 ?? []
  const phq9_3 = phq9Answers[2] ?? 0   // sleep
  const phq9_4 = phq9Answers[3] ?? 0   // energy
  const phq9_7 = phq9Answers[6] ?? 0   // concentration
  if ((scored.gad7?.score ?? 0) >= 10 && Math.max(phq9_3, phq9_4, phq9_7) >= 2) {
    tier = Math.min(4, tier + 1)
    firedRules.push('R3: Anxiety is affecting sleep, energy, or focus — this is impacting day-to-day functioning.')
  }

  // R4: Pervasive distress (3+ domains at weight ≥2)
  const moderatePlus = domains.filter(d => (d.weight ?? 0) >= 2).length
  if (moderatePlus >= 3) {
    tier = Math.min(4, tier + 1)
    firedRules.push('R4: Strain is showing across several areas, not just one.')
  }

  // 4. Early-signs detection (tier 0 → 1)
  if (tier === 0) {
    const mildDomains = domains.filter(d => d.weight === 1).length
    const gad7Ans = domainResults.gad7 ?? []
    const cbiAns  = domainResults.cbi  ?? []
    const pss10Ans = domainResults.pss10 ?? []

    const sentinelHit =
      (phq9Answers[2] ?? 0) >= 2 ||   // PHQ-9 sleep
      (phq9Answers[3] ?? 0) >= 2 ||   // PHQ-9 energy
      (phq9Answers[6] ?? 0) >= 2 ||   // PHQ-9 concentration
      (gad7Ans[0] ?? 0) >= 2 ||       // GAD-7 on edge
      (gad7Ans[3] ?? 0) >= 2 ||       // GAD-7 trouble relaxing
      (cbiAns[0] ?? 0) >= 75 ||       // CBI tired
      (cbiAns[4] ?? 0) >= 75 ||       // CBI worn out
      (pss10Ans[0] ?? 0) >= 3 ||      // PSS upset by unexpected
      (pss10Ans[1] ?? 0) >= 3         // PSS can't control things

    if (mildDomains >= 2 || sentinelHit) {
      tier = 1
      firedRules.push('Early signs: A few things you shared suggest you may be under more pressure than usual.')
    }
  }

  return buildOutput({ overall_tier: tier, safetyTriggered: false, domains, firedRules, mode })
}

function buildOutput({ overall_tier, safetyTriggered, domains, firedRules, mode }) {
  const sabiMessages = mode === 'friend' ? SABI_FRIEND : SABI_SELF
  const sabi_message = sabiMessages[overall_tier] ?? sabiMessages[4]

  // Dominant domain (highest weight, then first)
  const dominant = domains.reduce((best, d) => {
    if (!best || (d.weight ?? -1) > (best.weight ?? -1)) return d
    return best
  }, null)

  const micro_intervention = getMicroIntervention(overall_tier, dominant?.name ?? null)
  const recommendations = buildRecommendations(overall_tier, safetyTriggered)
  const resources_to_show = RESOURCES.filter(r => recommendations.includes(r.type))

  return {
    overall_tier,
    safety_triggered: safetyTriggered,
    mode,
    domains,
    fired_rules: firedRules,
    sabi_message,
    micro_intervention,
    recommendations,
    resources_to_show,
  }
}

function buildRecommendations(tier, safetyTriggered) {
  if (safetyTriggered || tier >= 4) return ['crisis_line', 'counsellor']
  if (tier === 3) return ['counsellor', 'crisis_line']
  if (tier === 2) return ['counsellor']
  if (tier === 1) return ['psychoeducation']
  return ['wellbeing']
}
