'use client'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const go = () => setOffline(!navigator.onLine)
    go()
    window.addEventListener('online',  go)
    window.addEventListener('offline', go)
    return () => {
      window.removeEventListener('online',  go)
      window.removeEventListener('offline', go)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 20px',
        background: '#1F2937',
        color: '#F8FAFC',
        fontSize: '0.82rem',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
      }}
    >
      <WifiOff size={14} strokeWidth={2} />
      No internet — you can still complete your check-in. Results push when you reconnect.
    </div>
  )
}
