import { getCheckinCount } from './profile'

const KEY_COUNT     = 'sabi_reminder_dismiss_count'
const KEY_LAST      = 'sabi_reminder_dismissed_at'

// Days to wait before showing again, indexed by dismissal count (0-based)
const CADENCE_DAYS = [7, 14, 30, 30] // 4th+ always monthly

// Message variants — rotated by total dismissal count so each visit feels fresh
const MESSAGES = [
  {
    heading: 'Make sure help can find you',
    body:    'If you ever send a distress signal, your counselling team needs a way to reach you. Linking your profile takes 60 seconds.',
  },
  {
    heading: 'One minute now could matter later',
    body:    'Counsellors respond faster when they already know who to call. Your check-ins stay anonymous — your profile is only used in emergencies.',
  },
  {
    heading: "You've checked in — but can we reach you?",
    body:    'Your screening results stay private. Your profile just gives counsellors a phone number if you ever press SOS.',
  },
  {
    heading: 'In a crisis, seconds count',
    body:    'A linked profile means counsellors know your name, number, and recent check-in before they even pick up the phone.',
  },
]

// Variant that includes the check-in count — shown after the 2nd check-in
function getCountMessage(count) {
  return {
    heading: `You've checked in ${count} time${count > 1 ? 's' : ''}`,
    body:    "That's great. But in an emergency, your team still can't reach you. Link your profile so they can.",
  }
}

function readInt(key, fallback = 0) {
  try { return parseInt(localStorage.getItem(key) ?? String(fallback), 10) } catch { return fallback }
}

function writeKey(key, value) {
  try { localStorage.setItem(key, String(value)) } catch {}
}

/**
 * Returns true if the reminder should be shown right now.
 * Always returns true if override = true (used on the SOS page).
 */
export function shouldShowReminder(override = false) {
  if (typeof window === 'undefined') return false
  if (override) return true

  const count    = readInt(KEY_COUNT)
  const lastMs   = readInt(KEY_LAST, 0)
  const daysWait = CADENCE_DAYS[Math.min(count, CADENCE_DAYS.length - 1)]
  const elapsed  = (Date.now() - lastMs) / 86_400_000 // in days

  return count === 0 || elapsed >= daysWait
}

/**
 * Record that the student dismissed the reminder right now.
 */
export function recordDismissal() {
  try {
    const count = readInt(KEY_COUNT)
    writeKey(KEY_COUNT, count + 1)
    writeKey(KEY_LAST, Date.now())
  } catch {}
}

/**
 * Returns the message object { heading, body } to display.
 * Rotates based on dismissal count and check-in count.
 */
export function getReminderMessage() {
  try {
    const dismissals  = readInt(KEY_COUNT)
    const checkins    = getCheckinCount()
    if (checkins >= 2 && dismissals % 3 === 2) return getCountMessage(checkins)
    return MESSAGES[dismissals % MESSAGES.length]
  } catch {
    return MESSAGES[0]
  }
}
