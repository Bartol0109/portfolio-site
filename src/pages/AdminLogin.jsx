import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DarkVeil from '../components/DarkVeil'
import Geo from '../components/Geo'

export default function AdminLogin() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Login failed')
      nav('/blog')
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DarkVeil />
      <Geo />
      <main className="auth-main">
        <h1 className="auth-title">Admin</h1>
        <p className="auth-subtitle">Log in to post new statuses.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="admin-user">Username</label>
          <input
            id="admin-user"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <label className="auth-label" htmlFor="admin-pass">Password</label>
          <input
            id="admin-pass"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
          {error ? <div className="auth-error">{error}</div> : null}
          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </main>
    </>
  )
}

