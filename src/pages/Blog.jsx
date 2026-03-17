import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DarkVeil from '../components/DarkVeil'
import Geo from '../components/Geo'

const FALLBACK = []

export default function Blog() {
  const fallback = useMemo(() => FALLBACK, [])
  const [updates, setUpdates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState('')

  const [body, setBody] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [adding, setAdding] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [editingError, setEditingError] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/updates.php', { credentials: 'include' })
        const data = await res.json()
        if (!alive) return
        setUpdates(Array.isArray(data?.updates) ? data.updates : fallback)
      } catch {
        if (!alive) return
        setUpdates(fallback)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [fallback])

  useEffect(() => {
    let alive = true
    async function check() {
      try {
        const res = await fetch('/api/admin/me.php', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!alive) return
        if (res.ok && data?.ok) {
          setIsAdmin(true)
          setAdminUser(String(data?.username || ''))
        } else {
          setIsAdmin(false)
          setAdminUser('')
        }
      } catch {
        if (!alive) return
        setIsAdmin(false)
        setAdminUser('')
      }
    }
    check()
    return () => { alive = false }
  }, [])

  async function submitStatus(e) {
    e.preventDefault()
    setSubmitError('')
    const text = body.trim()
    if (!text) return
    if (text.length > 500) {
      setSubmitError('Max 500 characters.')
      return
    }

    setAdding(true)
    try {
      const fd = new FormData()
      fd.append('body', text)
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch('/api/admin/status.php', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to post')

      setBody('')
      setImageFile(null)

      const fresh = await fetch('/api/updates.php', { credentials: 'include' })
      const freshData = await fresh.json().catch(() => ({}))
      setUpdates(Array.isArray(freshData?.updates) ? freshData.updates : updates)
    } catch (err) {
      setSubmitError(err?.message || 'Failed to post')
    } finally {
      setAdding(false)
    }
  }

  const list = Array.isArray(updates) ? updates : fallback

  async function saveEdit(e) {
    e.preventDefault()
    if (!editingId) return
    const text = editingBody.trim()
    if (!text) {
      setEditingError('Body is required.')
      return
    }
    if (text.length > 500) {
      setEditingError('Max 500 characters.')
      return
    }
    setSavingEdit(true)
    setEditingError('')
    try {
      const res = await fetch('/api/admin/updates.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: editingId, body: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to update')
      const fresh = await fetch('/api/updates.php', { credentials: 'include' })
      const freshData = await fresh.json().catch(() => ({}))
      setUpdates(Array.isArray(freshData?.updates) ? freshData.updates : updates)
      setEditingId(null)
      setEditingBody('')
    } catch (err) {
      setEditingError(err?.message || 'Failed to update')
    } finally {
      setSavingEdit(false)
    }
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this status?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/updates.php?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to delete')
      setUpdates((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== id) : prev))
    } catch (err) {
      // Show as submitError so je odmah vidljivo
      setSubmitError(err?.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <DarkVeil />
      <Geo />

      <main className="updates-main">
        <h1 className="updates-title">Blog</h1>
        <p className="updates-subtitle">Short status updates — what I’m working on lately.</p>

        {isAdmin ? (
          <section className="blog-admin">
            <div className="blog-admin-head">
              <div className="blog-admin-meta">
                Logged in as <strong>{adminUser || 'admin'}</strong>
              </div>
              <Link className="blog-admin-link" to="/admin/login">Admin</Link>
            </div>
            <form className="status-form" onSubmit={submitStatus}>
              <textarea
                className="status-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                placeholder="Write a status… (max 500 chars)"
                rows={4}
                required
              />
              <div className="status-row">
                <input
                  className="status-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <div className="status-count">{body.length}/500</div>
              </div>
              {submitError ? <div className="status-error">{submitError}</div> : null}
              <button className="status-button" type="submit" disabled={adding}>
                {adding ? 'Posting…' : 'Post status'}
              </button>
            </form>
          </section>
        ) : (
          <div className="blog-login-hint">
            <Link to="/admin/login">Log in</Link> to post.
          </div>
        )}

        {loading ? <div className="updates-loading">Loading…</div> : null}

        <div className="updates-grid">
          {list.map((post) => (
            <article key={post.id} className="update-card">
              {isAdmin ? (
                <div className="update-admin">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(post.id)
                      setEditingBody(post.body)
                      setEditingError('')
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    disabled={deletingId === post.id}
                  >
                    {deletingId === post.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              ) : null}
              <div className="update-meta">
                <span className="update-date">{post.date}</span>
                <span className="update-author">{post.author || 'Admin'}</span>
              </div>
              {post.title ? <h2 className="update-title">{post.title}</h2> : null}
              {post.image ? (
                <div className="update-image-frame">
                  <img className="update-image" src={post.image} alt="" loading="lazy" />
                </div>
              ) : null}
              {editingId === post.id ? (
                <form className="update-edit-form" onSubmit={saveEdit}>
                  <textarea
                    className="status-textarea"
                    value={editingBody}
                    onChange={(e) => setEditingBody(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  {editingError ? <div className="status-error">{editingError}</div> : null}
                  <div className="update-edit-actions">
                    <button className="status-button" type="submit" disabled={savingEdit}>
                      {savingEdit ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="status-button status-button--ghost"
                      onClick={() => {
                        setEditingId(null)
                        setEditingBody('')
                        setEditingError('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="update-body">{post.body}</p>
              )}
            </article>
          ))}
        </div>
      </main>
    </>
  )
}

