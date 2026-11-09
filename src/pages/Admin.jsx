import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { WORK_CATEGORIES, loadPortfolioItems } from '../lib/portfolioData'

const LINK_TYPES = ['Website', 'Github', 'Drive']

const emptyDraft = () => ({
  id: 0,
  title: '',
  category: WORK_CATEGORIES[0],
  description: '',
  featured: false,
  tags: [],
  file: null,
  preview: '',
})

function tagsFor(draft) {
  const rest = (draft.tags || []).filter((tag) => String(tag).toLowerCase() !== 'featured')
  return (draft.featured ? ['featured', ...rest] : rest).join(', ')
}

export default function Admin() {
  const { t } = useLanguage()
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [linkType, setLinkType] = useState(LINK_TYPES[0])
  const [linkUrl, setLinkUrl] = useState('')

  const load = useCallback(async () => {
    const list = await loadPortfolioItems()
    setItems(list || [])
  }, [])

  useEffect(() => {
    let alive = true
    fetch('/api/admin/me.php', { credentials: 'include' })
      .then((res) => res.json().catch(() => ({})))
      .then(async (data) => {
        if (!alive) return
        if (!data?.ok) {
          nav('/admin/login', { replace: true })
          return
        }
        await load()
        if (alive) setReady(true)
      })
      .catch(() => { if (alive) nav('/admin/login', { replace: true }) })
    return () => { alive = false }
  }, [load, nav])

  function openNew() {
    setError('')
    setDraft(emptyDraft())
  }

  function openEdit(item) {
    setError('')
    setDraft({
      id: item.id,
      title: item.title,
      category: WORK_CATEGORIES.includes(item.category) ? item.category : WORK_CATEGORIES[0],
      description: item.description || '',
      featured: item.featured,
      tags: item.tags || [],
      file: null,
      preview: item.image || '',
      gallery: item.gallery || [],
      links: item.links || [],
    })
  }

  function onFile(file) {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setDraft((current) => ({ ...current, file, preview }))
  }

  async function save(e) {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      if (draft.id) fd.append('id', String(draft.id))
      fd.append('category', draft.category)
      fd.append('title', draft.title.trim())
      fd.append('description', draft.description.trim())
      fd.append('tags', tagsFor(draft))
      if (draft.file) fd.append('image', draft.file)
      const res = await fetch('/api/portfolio.php', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.blocked ? t.auth.blocked : (data?.error || t.auth.fail))
      setNotice(t.admin.saved)
      setDraft(null)
      await load()
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/portfolio.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || t.auth.fail)
      setNotice(t.admin.deleted)
      setConfirmId(null)
      if (draft?.id === id) setDraft(null)
      await load()
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  async function addGallery(file) {
    if (!draft?.id || !file) return
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('portfolio_id', String(draft.id))
      fd.append('image', file)
      const res = await fetch('/api/portfolio/gallery.php', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || t.auth.fail)
      await load()
      setNotice(t.admin.saved)
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  async function removeGallery(id) {
    setBusy(true)
    try {
      const res = await fetch(`/api/portfolio/gallery.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(t.auth.fail)
      await load()
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  async function addLink(e) {
    e.preventDefault()
    if (!draft?.id || !linkUrl.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/portfolio/links.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio_id: draft.id, type: linkType, url: linkUrl.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || t.auth.fail)
      setLinkUrl('')
      await load()
      setNotice(t.admin.saved)
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!draft?.id) return
    const fresh = items.find((item) => item.id === draft.id)
    if (!fresh) return
    setDraft((current) => current && ({
      ...current,
      gallery: fresh.gallery,
      links: fresh.links,
      preview: current.file ? current.preview : (fresh.image || current.preview),
    }))
  }, [items, draft?.id])

  async function logout() {
    await fetch('/api/admin/logout.php', { method: 'POST', credentials: 'include' }).catch(() => {})
    nav('/')
  }

  if (!ready) {
    return <main className="studio"><p className="studio-note">{t.admin.loading}</p></main>
  }

  const current = draft?.id ? items.find((item) => item.id === draft.id) : null
  const gallery = current?.gallery || draft?.gallery || []
  const links = current?.links || draft?.links || []

  return (
    <main className="studio">
      <header className="studio-head">
        <div>
          <p className="auth-kicker">Bartol Barać</p>
          <h1 className="studio-title">{t.admin.title}</h1>
          <p className="studio-note">{t.admin.lead}</p>
        </div>
        <div className="studio-head-actions">
          <Link className="studio-text" to="/">{t.admin.back}</Link>
          <button type="button" className="studio-text" onClick={logout}>{t.nav.logout}</button>
        </div>
      </header>
      {notice ? <p className="studio-toast" role="status">{notice}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}

      <div className="studio-layout">
        <section className="studio-list" aria-label={t.admin.title}>
          <button type="button" className="cta cta--primary" onClick={openNew}>{t.admin.add}</button>
          {items.length === 0 ? <p className="studio-note">{t.admin.empty}</p> : null}
          <ul className="studio-items">
            {items.map((item) => (
              <li key={item.id} className="studio-item">
                {item.image ? <img src={item.image} alt="" /> : <span className="studio-item-empty" />}
                <div>
                  <p className="studio-item-title">{item.title}</p>
                  <p className="studio-item-meta">{item.category}{item.featured ? ' · featured' : ''}</p>
                </div>
                <div className="studio-item-actions">
                  <button type="button" onClick={() => openEdit(item)}>{t.admin.edit}</button>
                  {confirmId === item.id ? (
                    <>
                      <button type="button" className="is-danger" onClick={() => remove(item.id)} disabled={busy}>{t.admin.delete}</button>
                      <button type="button" onClick={() => setConfirmId(null)}>{t.admin.cancel}</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(item.id)}>{t.admin.delete}</button>
                  )}
                </div>
                {confirmId === item.id ? <p className="studio-confirm">{t.admin.confirm}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        {draft ? (
          <form className="studio-form" onSubmit={save}>
            <h2>{draft.id ? t.admin.edit : t.admin.add}</h2>
            <label htmlFor="studio-title">{t.admin.titleField}</label>
            <input id="studio-title" className="auth-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={200} required />
            <label htmlFor="studio-cat">{t.admin.category}</label>
            <select id="studio-cat" className="auth-input auth-select" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {WORK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label htmlFor="studio-desc">{t.admin.description}</label>
            <textarea id="studio-desc" className="auth-input studio-area" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={500} rows={4} />
            <p className="studio-note">{t.admin.descriptionHint}</p>
            <label className="studio-check">
              <input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
              {t.admin.featured}
            </label>
            <label>{t.admin.cover}</label>
            <label
              className="studio-drop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}
            >
              {draft.preview ? <img src={draft.preview} alt="" /> : <span>{t.admin.drop}</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <div className="studio-form-actions">
              <button className="cta cta--primary" type="submit" disabled={busy}>{busy ? t.admin.saving : t.admin.save}</button>
              <button type="button" className="studio-text" onClick={() => setDraft(null)}>{t.admin.cancel}</button>
            </div>

            {draft.id ? (
              <>
                <h3>{t.admin.gallery}</h3>
                <p className="studio-note">{t.admin.galleryHint}</p>
                <div className="studio-gallery">
                  {gallery.map((image) => (
                    <figure key={image.id}>
                      <img src={image.image} alt="" />
                      <button type="button" onClick={() => removeGallery(image.id)}>{t.admin.delete}</button>
                    </figure>
                  ))}
                </div>
                {gallery.length < 5 ? (
                  <label className="studio-file">
                    {t.admin.gallery}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => addGallery(e.target.files?.[0])} />
                  </label>
                ) : null}
                <h3>{t.admin.link}</h3>
                <ul className="studio-links">
                  {links.map((link) => (
                    <li key={link.id}>{link.type}: {link.url}</li>
                  ))}
                </ul>
                <div className="studio-link-row">
                  <select className="auth-input auth-select" value={linkType} onChange={(e) => setLinkType(e.target.value)} aria-label={t.admin.link}>
                    {LINK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input className="auth-input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={t.admin.linkPh} />
                  <button type="button" onClick={addLink}>{t.admin.addLink}</button>
                </div>
              </>
            ) : null}
          </form>
        ) : null}
      </div>
    </main>
  )
}
