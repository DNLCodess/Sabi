'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import SabiAvatar from '@/components/SabiAvatar'
import AnswerChip from '@/components/AnswerChip'
import ProgressBar from '@/components/ProgressBar'
import { ArrowLeft } from 'lucide-react'
import { DOMAINS } from '@/lib/instruments'
import { getAdaptivePath } from '@/lib/skipLogic'
import { runEngine } from '@/lib/engine'
import { pushAggregateResult } from '@/lib/supabase'

// answersByDomain: { [domainId]: Array<{itemIndex, value}> } — in presentation order
// This avoids sparse-array confusion: answered items tracked as a Set of itemIndexes.

function buildQueue(domainIds, answersByDomain) {
  const queue = []
  for (const domainId of domainIds) {
    const domain = DOMAINS[domainId]
    if (!domain) continue
    const domainAnswers = answersByDomain[domainId] ?? []
    const values = domainAnswers.map(a => a.value)          // presentation-order values for skip logic
    const answeredSet = new Set(domainAnswers.map(a => a.itemIndex))
    const path = getAdaptivePath(domainId, values)
    for (const itemIndex of path) {
      if (!answeredSet.has(itemIndex)) {
        queue.push({ domainId, itemIndex, item: domain.items[itemIndex] })
      }
    }
  }
  return queue
}

function toScoringArrays(domainIds, answersByDomain) {
  const result = {}
  for (const domainId of domainIds) {
    const domainAnswers = answersByDomain[domainId] ?? []
    if (!domainAnswers.length) continue
    const arr = new Array(DOMAINS[domainId].items.length).fill(undefined)
    for (const { itemIndex, value } of domainAnswers) {
      arr[itemIndex] = value
    }
    result[domainId] = arr
  }
  return result
}

export default function ScreenPage() {
  const router = useRouter()
  const [domainIds, setDomainIds] = useState([])
  const [mode, setMode] = useState('self')
  // answersByDomain: { [domainId]: [{itemIndex, value}] }
  const [answersByDomain, setAnswersByDomain] = useState({})
  // snapshots for back navigation — each entry is a previous answersByDomain state
  const [snapshots, setSnapshots] = useState([])
  const [animating, setAnimating] = useState(false)
  // displayedQuestion is frozen during animation so the bubble doesn't flicker mid-fade
  const [displayedQuestion, setDisplayedQuestion] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const ids = JSON.parse(sessionStorage.getItem('sabi_domains') ?? '[]')
    const m   = sessionStorage.getItem('sabi_mode') ?? 'self'
    if (!ids.length) { router.replace('/check-in'); return }

    // Pick up PHQ-4 pre-answers seeded by /check-in gateway phase
    const seeded = JSON.parse(sessionStorage.getItem('sabi_answers') ?? '{}')
    sessionStorage.removeItem('sabi_answers')

    setDomainIds(ids)
    setMode(m)
    setAnswersByDomain(seeded)
    const first = buildQueue(ids, seeded)[0] ?? null
    setDisplayedQuestion(first)
    setLoaded(true)
  }, [router])

  // These are derived — no separate state, no stale-closure risk
  const answeredCount = useMemo(
    () => Object.values(answersByDomain).reduce((s, arr) => s + arr.length, 0),
    [answersByDomain]
  )
  const remainingQueue = useMemo(
    () => buildQueue(domainIds, answersByDomain),
    [domainIds, answersByDomain]
  )
  const totalEstimate = answeredCount + remainingQueue.length

  const handleAnswer = (value) => {
    if (animating || !displayedQuestion) return
    setAnimating(true)

    const { domainId, itemIndex } = displayedQuestion

    setSnapshots(prev => [...prev, answersByDomain])
    setAnswersByDomain(prev => {
      const next = {
        ...prev,
        [domainId]: [...(prev[domainId] ?? []), { itemIndex, value }],
      }
      const nextQueue = buildQueue(domainIds, next)

      setTimeout(() => {
        setAnimating(false)
        if (nextQueue.length === 0) {
          const scoringArrays = toScoringArrays(domainIds, next)
          const result = runEngine(scoringArrays, mode)
          sessionStorage.setItem('sabi_result', JSON.stringify(result))
          pushAggregateResult({ tier: result.overall_tier, mode, domains: result.domains })
          router.push('/results')
        } else {
          setDisplayedQuestion(nextQueue[0])
        }
      }, 220)

      return next
    })
  }

  const handleBack = () => {
    if (snapshots.length === 0) {
      router.push('/check-in')
      return
    }
    const prevAnswers = snapshots[snapshots.length - 1]
    const prevQueue = buildQueue(domainIds, prevAnswers)
    setAnswersByDomain(prevAnswers)
    setSnapshots(s => s.slice(0, -1))
    setDisplayedQuestion(prevQueue[0] ?? null)
  }

  if (!loaded || !displayedQuestion) return null

  const isFriend = mode === 'friend'
  const domainLabel = DOMAINS[displayedQuestion.domainId]?.label ?? ''
  const options = DOMAINS[displayedQuestion.domainId]?.options ?? []
  const questionNumber = answeredCount + 1

  const isCBI = displayedQuestion.domainId === 'cbi'
  let displayText
  if (isCBI) {
    displayText = isFriend
      ? displayedQuestion.item.text
          .replace('do you', 'does your friend')
          .replace('are you', 'is your friend')
      : displayedQuestion.item.text
  } else {
    const prefix = isFriend
      ? 'How often has your friend'
      : 'Over the last while, how often have you'
    displayText = `${prefix} ${displayedQuestion.item.text.toLowerCase().replace(/\?$/, '')}?`
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <ProgressBar current={questionNumber} total={totalEstimate || 1} />

      <div style={{
        flex: 1,
        maxWidth: 560,
        margin: '0 auto',
        width: '100%',
        padding: '20px 20px 120px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingTop: 20 }}>
          <button
            onClick={handleBack}
            aria-label="Go back"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, minWidth: 44,
              borderRadius: 'var(--r-full)',
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--text-secondary)" />
          </button>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-secondary)',
          }}>
            {domainLabel} · {questionNumber} of ~{totalEstimate}
          </span>
        </div>

        {/* SABI bubble */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
          <div style={{ paddingTop: 2 }}>
            <SabiAvatar size={42} />
          </div>
          <div style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px 20px 20px 20px',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-2)',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          }}>
            <p style={{
              margin: 0,
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              lineHeight: 1.65,
              fontFamily: 'var(--font-body)',
            }}>
              {displayText}
            </p>
            {displayedQuestion.item.safetyItem && (
              <p style={{
                margin: '12px 0 0',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 10,
              }}>
                This is an important question. Be honest — your answer stays here.
              </p>
            )}
          </div>
        </div>

        {/* Answer chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(opt => (
            <AnswerChip
              key={opt.value}
              label={opt.label}
              selected={false}
              onClick={() => handleAnswer(opt.value)}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
