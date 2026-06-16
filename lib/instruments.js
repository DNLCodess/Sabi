// ── PHQ-9 ────────────────────────────────────────────────────────────
// Validated cut-off ≥5 for Nigerian university students (Adewuya et al., 2006)
export const PHQ9_ITEMS = [
  { id: 'phq9_1', text: 'Little interest or pleasure in doing things', skippable: false, safetyItem: false },
  { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless', skippable: false, safetyItem: false },
  { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much', skippable: false, safetyItem: false },
  { id: 'phq9_4', text: 'Feeling tired or having little energy', skippable: true, safetyItem: false },
  { id: 'phq9_5', text: 'Poor appetite or overeating', skippable: true, safetyItem: false },
  { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure', skippable: true, safetyItem: false },
  { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading or watching TV', skippable: false, safetyItem: false },
  { id: 'phq9_8', text: 'Moving or speaking so slowly that others could have noticed, or the opposite', skippable: true, safetyItem: false },
  { id: 'phq9_9', text: 'Thoughts that you would be better off dead, or of hurting yourself', skippable: false, safetyItem: true },
]

export const PHQ9_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
]

// ── GAD-7 ────────────────────────────────────────────────────────────
export const GAD7_ITEMS = [
  { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge', skippable: false },
  { id: 'gad7_2', text: 'Not being able to stop or control worrying', skippable: false },
  { id: 'gad7_3', text: 'Worrying too much about different things', skippable: true },
  { id: 'gad7_4', text: 'Trouble relaxing', skippable: true },
  { id: 'gad7_5', text: 'Being so restless that it is hard to sit still', skippable: true },
  { id: 'gad7_6', text: 'Becoming easily annoyed or irritable', skippable: true },
  { id: 'gad7_7', text: 'Feeling afraid as if something awful might happen', skippable: false },
]

export const GAD7_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
]

// ── PSS-10 ───────────────────────────────────────────────────────────
// Items 4,5,7,8 (1-indexed) must be reverse-scored before summing
export const PSS10_ITEMS = [
  { id: 'pss_1',  text: 'Been upset because of something that happened unexpectedly?', reverse: false },
  { id: 'pss_2',  text: "Felt that you were unable to control the important things in your life?", reverse: false },
  { id: 'pss_3',  text: 'Felt nervous and stressed?', reverse: false },
  { id: 'pss_4',  text: 'Felt confident about your ability to handle your personal problems?', reverse: true },
  { id: 'pss_5',  text: 'Felt that things were going your way?', reverse: true },
  { id: 'pss_6',  text: 'Found that you could not cope with all the things that you had to do?', reverse: false },
  { id: 'pss_7',  text: 'Been able to control irritations in your life?', reverse: true },
  { id: 'pss_8',  text: 'Felt that you were on top of things?', reverse: true },
  { id: 'pss_9',  text: 'Been angered because of things that were outside of your control?', reverse: false },
  { id: 'pss_10', text: 'Felt difficulties were piling up so high that you could not overcome them?', reverse: false },
]

export const PSS10_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: 'Almost never', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Fairly often', value: 3 },
  { label: 'Very often', value: 4 },
]

// ── CBI Personal Burnout (6 items, public domain) ───────────────────
export const CBI_ITEMS = [
  { id: 'cbi_1', text: 'How often do you feel tired?' },
  { id: 'cbi_2', text: 'How often are you physically exhausted?' },
  { id: 'cbi_3', text: 'How often are you emotionally exhausted?' },
  { id: 'cbi_4', text: 'How often do you think: "I can\'t take it anymore"?' },
  { id: 'cbi_5', text: 'How often do you feel worn out?' },
  { id: 'cbi_6', text: 'How often do you feel weak and susceptible to illness?' },
]

export const CBI_OPTIONS = [
  { label: 'Never / almost never', value: 0 },
  { label: 'Seldom', value: 25 },
  { label: 'Sometimes', value: 50 },
  { label: 'Often', value: 75 },
  { label: 'Always', value: 100 },
]

// ── Domain manifest ──────────────────────────────────────────────────
export const DOMAINS = {
  phq9:  { label: 'Low mood',  items: PHQ9_ITEMS,  options: PHQ9_OPTIONS },
  gad7:  { label: 'Anxiety',   items: GAD7_ITEMS,  options: GAD7_OPTIONS },
  pss10: { label: 'Stress',    items: PSS10_ITEMS, options: PSS10_OPTIONS },
  cbi:   { label: 'Burnout',   items: CBI_ITEMS,   options: CBI_OPTIONS },
}
