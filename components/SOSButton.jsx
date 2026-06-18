'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LifeBuoy } from 'lucide-react'

export default function SOSButton() {
  const path = usePathname()

  // Not shown on the authority dashboard, login, or the SOS page itself
  if (path.startsWith('/authority') || path === '/sos') return null

  return (
    <Link
      href="/sos"
      prefetch={true}
      aria-label="Emergency — I need help now"
      style={{
        position: 'fixed',
        // Sit above the sticky CTA bar (which is 76px tall on landing)
        bottom: 88,
        right: 18,
        zIndex: 50,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'var(--crisis)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 18px rgba(217,83,79,0.45)',
        textDecoration: 'none',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
    >
      <LifeBuoy size={22} strokeWidth={2} />
    </Link>
  )
}
