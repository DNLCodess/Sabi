import { PHQ9_ITEMS, GAD7_ITEMS, PSS10_ITEMS, CBI_ITEMS } from './instruments.js'

/**
 * Returns the ordered array of item indexes (0-based) to ask for a domain,
 * given the answers collected so far.
 *
 * Safety items are NEVER skipped. Skippable items are omitted when early
 * answers are consistently low, shortening the path for low-risk users.
 */
export function getAdaptivePath(domain, answeredSoFar) {
  switch (domain) {
    case 'phq9':  return phq9Path(answeredSoFar)
    case 'gad7':  return gad7Path(answeredSoFar)
    case 'pss10': return fullPath(PSS10_ITEMS)
    case 'cbi':   return fullPath(CBI_ITEMS)
    default:      return []
  }
}

function fullPath(items) {
  return items.map((_, i) => i)
}

function phq9Path(answers) {
  // Always ask items 0,1,2 (indexes) first
  const base = [0, 1, 2]

  if (answers.length < 3) return base

  const firstThree = answers.slice(0, 3)
  const allLow = firstThree.every(v => v <= 1)

  if (allLow) {
    // Skip items at indexes 3,4,5,7 (PHQ-9 items 4,5,6,8)
    // Always keep index 6 (item 7 – concentration) and index 8 (item 9 – safety)
    return [...base, 6, 8]
  }

  return base.concat([3, 4, 5, 6, 7, 8])
}

function gad7Path(answers) {
  const base = [0, 1]

  if (answers.length < 2) return base

  const firstTwo = answers.slice(0, 2)
  const bothZero = firstTwo.every(v => v === 0)

  if (bothZero) {
    // Skip items at indexes 2,3,4,5; always ask index 6 (item 7 – impact)
    return [...base, 6]
  }

  return base.concat([2, 3, 4, 5, 6])
}

/**
 * Given a domain and a flat answers array (values only, in presentation order),
 * returns how many questions remain in the adaptive path.
 */
export function getRemainingCount(domain, answeredSoFar) {
  const path = getAdaptivePath(domain, answeredSoFar)
  return Math.max(0, path.length - answeredSoFar.length)
}
