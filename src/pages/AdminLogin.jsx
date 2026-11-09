import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function AdminLogin() {
  const nav = useNavigate()
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/admin/me.php', { credentials: 'include' })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (alive && data?.ok) nav('/admin', { replace: true })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [nav])

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
      if (!res.ok) {
        throw new Error(data?.blocked ? t.auth.blocked : t.auth.fail)
      }
      setEntered(true)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.setTimeout(() => nav('/admin', { replace: true }), reduce ? 80 : 900)
    } catch (err) {
      setError(err?.message === t.auth.blocked ? t.auth.blocked : t.auth.fail)
      setShake(true)
      window.setTimeout(() => setShake(false), 480)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={`auth-main${entered ? ' is-in' : ''}`}>
      <div className={`auth-card${shake ? ' is-shake' : ''}${entered ? ' is-in' : ''}`}>
        <figure className="auth-portrait">
          <img src="/slike/Profilna.jpg" alt="" />
        </figure>
        <p className="auth-kicker">{t.auth.hint}</p>
        <p className="auth-wordmark">Bartol Barać</p>
        {entered ? <p className="auth-ok" role="status">{t.auth.ok}</p> : null}
        <form className="auth-form" onSubmit={onSubmit} hidden={entered}>
          <label className="auth-label" htmlFor="studio-user">{t.auth.user}</label>
          <input
            id="studio-user"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <label className="auth-label" htmlFor="studio-pass">{t.auth.pass}</label>
          <input
            id="studio-pass"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? t.auth.submitting : t.auth.submit}
          </button>
        </form>
      </div>
    </main>
  )
}
