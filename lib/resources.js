/**
 * Static resource constants.
 * UPDATE before demo: fill in your campus counsellor's actual name, room, and hours.
 */

export const RESOURCES = [
  {
    type: 'counsellor',
    label: 'Campus Counselling Centre',
    detail: 'Student Affairs Division · Mon–Fri 8am–4pm · Free & confidential',
    action: 'Visit or call',
    value: '+234 800 000 0000',
    icon: 'HeartHandshake',
  },
  {
    type: 'crisis_line',
    label: 'MANI Crisis Line',
    detail: 'Mentally Aware Nigeria Initiative · Free · 24/7',
    action: 'Call now',
    value: '0800 800 2000',
    icon: 'PhoneCall',
  },
  {
    type: 'psychoeducation',
    label: 'Understanding What You\'re Feeling',
    detail: 'Short reads on stress, anxiety, and burnout from MANI',
    action: 'Read',
    value: 'https://mentallyaware.org',
    icon: 'BookOpen',
  },
  {
    type: 'wellbeing',
    label: 'Wellbeing Tips',
    detail: 'Sleep, movement, and connection — the basics that actually help',
    action: 'Read',
    value: 'https://mentallyaware.org',
    icon: 'CheckCircle2',
  },
]

export const PEER_SUPPORT_TIPS = [
  {
    heading: 'Start with presence, not advice',
    body: '"I\'ve noticed you\'ve seemed off lately. I\'m here if you want to talk — no pressure." Then just listen.',
  },
  {
    heading: 'Don\'t try to fix it',
    body: 'Your job isn\'t to solve their problems. It\'s to make sure they don\'t feel alone with them.',
  },
  {
    heading: 'Normalise getting help',
    body: '"A lot of people go to the counselling centre — it\'s actually really helpful and they can\'t share anything you say." Sharing removes the stigma.',
  },
]

export const BARRIER_PANEL = [
  { icon: 'Lock',           text: 'Anonymous · No name · Nothing saved' },
  { icon: 'HeartHandshake', text: 'Routes to real, qualified support' },
  { icon: 'CalendarCheck',  text: 'Free to use, any time' },
  { icon: 'MessageCircle',  text: 'Everything stays between you and SABI' },
]
