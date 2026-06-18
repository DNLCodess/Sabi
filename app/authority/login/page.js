'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAuthorityClient, signIn } from '@/lib/authorityClient'

export default function AuthorityLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getAuthorityClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/authority')
      else setChecking(false)
    })
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email, password)
    if (err) {
      setError('Invalid email or password. Contact IT if you need access.')
      setLoading(false)
    } else {
      router.replace('/authority')
    }
  }

  if (checking) return null

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Image src="/logo.png" alt="SABI" width={88} height={30} style={{ objectFit: 'contain', marginBottom: 20 }} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
          }}>
            Authority Access
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Campus counselling staff only
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                padding: '13px 16px',
                borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                background: 'var(--surface)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                padding: '13px 16px',
                borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                background: 'var(--surface)',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
            />
          </label>

          {error && (
            <p style={{
              color: 'var(--crisis)',
              fontSize: '0.875rem',
              margin: 0,
              padding: '10px 14px',
              background: '#FEF2F2',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--crisis)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              padding: '14px',
              borderRadius: 'var(--r-full)',
              background: 'var(--grad-aurora)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'var(--font-body)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || (!email || !password) ? 0.65 : 1,
              marginTop: 4,
              transition: 'opacity 150ms ease',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
        }}>
          Account access is managed by your institution's IT department.
          <br />Students should use the <a href="/" style={{ color: 'var(--primary)' }}>main SABI app</a>.
        </p>
      </div>
    </main>
  )
}
