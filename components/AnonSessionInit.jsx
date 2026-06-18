'use client'
import { useEffect } from 'react'
import { ensureAnonSession } from '@/lib/supabase'

// Fires ensureAnonSession once on mount — gives every student a stable
// anonymous JWT so profile RLS and check-in history work without a login.
export default function AnonSessionInit() {
  useEffect(() => { ensureAnonSession() }, [])
  return null
}
