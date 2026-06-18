'use client'
import ProfileOptIn from '@/components/ProfileOptIn'

// Thin client wrapper so the landing page (Server Component) can render
// the compact reminder banner without becoming fully client-side.
export default function ProfileReminderBanner() {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 20px 16px' }}>
      <ProfileOptIn variant="compact" />
    </div>
  )
}
