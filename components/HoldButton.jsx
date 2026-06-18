'use client'
import { useState, useRef, useCallback } from 'react'

export default function HoldButton({ onComplete, label = 'Hold', duration = 3000 }) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const intervalRef = useRef(null)
  const startRef   = useRef(null)

  const start = useCallback(() => {
    setHolding(true)
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min(100, (elapsed / duration) * 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(intervalRef.current)
        setHolding(false)
        setProgress(0)
        onComplete()
      }
    }, 30)
  }, [duration, onComplete])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setHolding(false)
    setProgress(0)
  }, [])

  const radius = 38
  const circumference = 2 * Math.PI * radius

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      aria-label={`${label} — hold ${Math.round(duration / 1000)} seconds to send distress signal`}
      style={{
        position: 'relative',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: holding ? '#B91C1C' : '#D9534F',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        boxShadow: holding
          ? '0 0 0 10px rgba(217,83,79,0.2), 0 0 0 20px rgba(217,83,79,0.08)'
          : '0 6px 20px rgba(217,83,79,0.4)',
        transition: 'background 150ms ease, box-shadow 200ms ease',
      }}
    >
      {/* Circular progress ring */}
      <svg
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
        viewBox="0 0 100 100"
        width={100}
        height={100}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 30ms linear' }}
        />
      </svg>
      <span style={{
        position: 'relative', zIndex: 1,
        color: 'white',
        fontSize: '0.7rem',
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.3,
        maxWidth: 56,
        fontFamily: 'var(--font-body)',
        pointerEvents: 'none',
      }}>
        {holding
          ? `${Math.ceil(duration / 1000 - (progress / 100) * (duration / 1000))}s`
          : label}
      </span>
    </button>
  )
}
