'use client'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRSection() {
  const [appUrl, setAppUrl] = useState(null)

  useEffect(() => {
    setAppUrl(window.location.origin)
  }, [])

  if (!appUrl) return null

  return (
    <section style={{
      padding: '32px 20px 160px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <p style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
        margin: 0,
      }}>
        Scan to check in from any device
      </p>
      <div style={{
        padding: 16,
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-2)',
      }}>
        <QRCodeSVG value={appUrl} size={120} bgColor="transparent" level="M" />
      </div>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-disabled)',
        textAlign: 'center',
        maxWidth: 220,
        margin: 0,
        lineHeight: 1.5,
      }}>
        Print for hostel noticeboards, lecture halls, or common rooms
      </p>
    </section>
  )
}
