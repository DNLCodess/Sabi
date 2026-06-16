/**
 * Maps (tier, dominant_domain) → a 2-minute evidence-based exercise.
 * Framed as coping support, never as therapy or diagnosis.
 */

const INTERVENTIONS = {
  crisis: {
    title: '5-4-3-2-1 Grounding',
    duration: '2 min',
    description: 'A quick way to feel more present when everything feels overwhelming.',
    steps: [
      'Look around — name 5 things you can see right now.',
      'Notice 4 things you can physically feel (floor, chair, air on skin).',
      'Listen for 3 sounds in your environment.',
      'Find 2 things you can smell, or think of 2 scents you like.',
      'Notice 1 thing you can taste right now.',
      'Take a slow breath. You are here, you are safe right now.',
    ],
  },
  anxiety: {
    title: 'Box Breathing',
    duration: '2 min',
    description: 'Used by athletes and first-responders to calm the nervous system fast.',
    steps: [
      'Sit comfortably and relax your shoulders.',
      'Breathe IN slowly for 4 counts.',
      'HOLD your breath for 4 counts.',
      'Breathe OUT slowly for 4 counts.',
      'HOLD again for 4 counts.',
      'Repeat 4 times. That\'s it.',
    ],
  },
  stress: {
    title: 'Paced Breathing + One Offload',
    duration: '2 min',
    description: 'Slow your breath first, then get one thing out of your head.',
    steps: [
      'Breathe in for 4 counts, out for 6. Do this 5 times.',
      'Grab your phone or a piece of paper.',
      'Write down the ONE thing stressing you most right now.',
      'Put a star next to anything on that list you can actually control today.',
      'Set the list aside — it\'s captured. You don\'t have to hold it in your head.',
    ],
  },
  burnout: {
    title: 'Permission to Rest',
    duration: '2 min',
    description: 'Rest is not a reward. It\'s maintenance.',
    steps: [
      'Find somewhere comfortable to sit or lie down.',
      'Set a 10-minute timer (do this now — don\'t skip it).',
      'Close your eyes or soften your gaze. Do absolutely nothing.',
      'When thoughts about tasks come up, gently remind yourself: "I\'ll deal with that after the timer."',
      'Tonight: pick ONE non-negotiable bedtime and protect it.',
    ],
  },
  low_mood: {
    title: 'One Small Step',
    duration: '2 min',
    description: 'Low mood shrinks the world. Action — even tiny — expands it back.',
    steps: [
      'Think of ONE tiny thing you\'ve been putting off (reply to a message, drink water, step outside).',
      'It must take under 5 minutes.',
      'Set a timer for 5 minutes and do that one thing now.',
      'That\'s it. You don\'t need to do anything else.',
      'Notice how you feel after — even a small completion shifts things.',
    ],
  },
  wellbeing: {
    title: 'Two-Minute Wind-Down',
    duration: '2 min',
    description: 'A quick reset to carry the good forward.',
    steps: [
      'Take three slow, deep breaths.',
      'Think of one thing that went okay today — however small.',
      'Think of one person you\'re grateful exists in your life.',
      'Drink a glass of water.',
      'That\'s your daily maintenance. Keep it up.',
    ],
  },
}

export function getMicroIntervention(tier, dominantDomain) {
  let key

  if (tier >= 4) key = 'crisis'
  else if (dominantDomain === 'gad7') key = 'anxiety'
  else if (dominantDomain === 'pss10') key = 'stress'
  else if (dominantDomain === 'cbi') key = 'burnout'
  else if (dominantDomain === 'phq9') key = 'low_mood'
  else key = 'wellbeing'

  return INTERVENTIONS[key]
}
