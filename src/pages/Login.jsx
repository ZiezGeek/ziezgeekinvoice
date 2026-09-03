import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError('Could not sign in — check the email and password and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
      <div className="panel" style={{ width: 380, maxWidth: '100%', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Logo variant="full" height={110} />
        </div>
        <hr className="circuit-rule" style={{ marginBottom: 22 }} />

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -6, marginBottom: 14 }}>
              {error}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
          Staff accounts are created in Firebase — ask an admin for access.
        </p>
      </div>
    </div>
  )
}
