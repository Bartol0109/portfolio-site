import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { WORK_CATEGORIES, loadPortfolioItems } from '../lib/portfolioData'

const LINK_TYPES = ['Website', 'Github', 'Drive']
const MAX_PHOTOS = 20

let photoSeq = 1
const nextKey = () => { photoSeq += 1; return `ph-${photoSeq}` }

function tagsFor(draft) {
  return (draft.tags || []).join(', ')
}

function uploadRequest(url, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.withCredentials = true
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText || '{}') } catch { data = {} }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data.blocked ? 'blocked' : (data.error || 'Upload failed')))
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    if (body instanceof FormData) xhr.send(body)
    else {
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify(body))
    }
  })
}

function photosFromItem(item) {
  const photos = []
  if (item.image) photos.push({ key: nextKey(), url: item.image, kind: 'cover' })
  ;(item.gallery || []).forEach((image) => {
    photos.push({ key: nextKey(), url: image.image, galleryId: image.id, kind: 'gallery' })
  })
  return photos
}

export default function Admin() {
  const { t } = useLanguage()
  const nav = useNavigate()
  const fileRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState(null)
  const [photos, setPhotos] = useState([])
  const [removedGallery, setRemovedGallery] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [linksOpen, setLinksOpen] = useState(false)
  const [linkType, setLinkType] = useState(LINK_TYPES[0])
  const [linkUrl, setLinkUrl] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [tab, setTab] = useState('works')
  const [picks, setPicks] = useState([])
  const pickDrag = useRef(null)
  const dragFrom = useRef(null)

  const load = useCallback(async () => {
    const list = await loadPortfolioItems()
    setItems(list || [])
    return list || []
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
        const list = await load()
        if (alive) {
          setPicks(list.filter((item) => Number.isFinite(item.featuredOrder) && item.featuredOrder > 0).sort((a, b) => a.featuredOrder - b.featuredOrder))
          setReady(true)
        }
      })
      .catch(() => { if (alive) nav('/admin/login', { replace: true }) })
    return () => { alive = false }
  }, [load, nav])

  function openNew() {
    setError('')
    setShowAll(false)
    setLinksOpen(false)
    setRemovedGallery([])
    setPhotos([])
    setDraft({ id: 0, title: '', category: WORK_CATEGORIES[0], description: '', featured: false, tags: [], links: [] })
  }

  function openEdit(item) {
    setError('')
    setShowAll(true)
    setLinksOpen((item.links || []).length > 0)
    setRemovedGallery([])
    setPhotos(photosFromItem(item))
    setDraft({
      id: item.id,
      title: item.title,
      category: WORK_CATEGORIES.includes(item.category) ? item.category : WORK_CATEGORIES[0],
      description: item.description || '',
      featured: item.featured,
      tags: item.tags || [],
      links: item.links || [],
    })
  }

  function addFiles(list) {
    const incoming = [...list].filter((file) => /image\/(jpeg|png|webp)/.test(file.type) && file.size <= 5 * 1024 * 1024)
    setPhotos((current) => {
      const room = MAX_PHOTOS - current.length
      const next = incoming.slice(0, Math.max(0, room)).map((file) => ({
        key: nextKey(),
        file,
        url: URL.createObjectURL(file),
        kind: 'new',
        progress: null,
      }))
      return [...current, ...next]
    })
    if (incoming.length && photos.length + incoming.length > MAX_PHOTOS) setError(t.admin.limit)
  }

  function removePhoto(key) {
    setPhotos((current) => {
      const photo = current.find((item) => item.key === key)
      if (photo?.url?.startsWith('blob:')) URL.revokeObjectURL(photo.url)
      if (photo?.galleryId) setRemovedGallery((ids) => [...ids, photo.galleryId])
      return current.filter((item) => item.key !== key)
    })
  }

  function movePhoto(from, to) {
    if (from === to || from < 0 || to < 0) return
    setPhotos((current) => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function setProgress(key, progress) {
    setPhotos((current) => current.map((photo) => (photo.key === key ? { ...photo, progress } : photo)))
  }

  async function publish(e) {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    setError('')
    try {
      const cover = photos[0]
      const fd = new FormData()
      if (draft.id) fd.append('id', String(draft.id))
      fd.append('category', draft.category)
      fd.append('title', draft.title.trim())
      fd.append('description', draft.description.trim())
      fd.append('tags', tagsFor(draft))
      if (cover?.file) {
        fd.append('image', cover.file)
        setProgress(cover.key, 5)
      } else if (cover?.galleryId) {
        fd.append('cover_gallery_id', String(cover.galleryId))
      }
      const saved = await uploadRequest('/api/portfolio.php', fd, (value) => {
        if (cover?.file) setProgress(cover.key, value)
      })
      if (saved?.blocked) throw new Error(t.auth.blocked)
      let itemId = draft.id
      if (!itemId) {
        const before = new Set(items.map((item) => item.id))
        const fresh = await load()
        const created = fresh.find((item) => item.title === draft.title.trim() && !before.has(item.id)) || fresh[0]
        itemId = created?.id
      }
      if (!itemId) throw new Error(t.auth.fail)
      for (const id of removedGallery) {
        await fetch(`/api/portfolio/gallery.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      }
      const uploadedIds = []
      for (const photo of photos.slice(1)) {
        if (photo.galleryId && !removedGallery.includes(photo.galleryId)) {
          uploadedIds.push(photo.galleryId)
          continue
        }
        if (!photo.file) continue
        setProgress(photo.key, 8)
        const imageData = new FormData()
        imageData.append('portfolio_id', String(itemId))
        imageData.append('image', photo.file)
        const result = await uploadRequest('/api/portfolio/gallery.php', imageData, (value) => setProgress(photo.key, value))
        if (result?.id) uploadedIds.push(result.id)
        setProgress(photo.key, 100)
      }
      if (uploadedIds.length) {
        await uploadRequest('/api/portfolio/gallery.php', { portfolio_id: itemId, order: uploadedIds })
      }
      setNotice(t.admin.saved)
      setDraft(null)
      setPhotos([])
      await load()
    } catch (err) {
      setError(err?.message === 'blocked' ? t.auth.blocked : (err?.message || t.auth.fail))
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

  async function addLink() {
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
      const fresh = await load()
      const item = fresh.find((entry) => entry.id === draft.id)
      if (item) setDraft((current) => ({ ...current, links: item.links || [] }))
    } catch (err) {
      setError(err?.message || t.auth.fail)
    } finally {
      setBusy(false)
    }
  }

  function addPick(item) {
    setPicks((current) => (current.length >= 5 || current.some((entry) => entry.id === item.id) ? current : [...current, item]))
  }

  function movePick(from, to) {
    if (to < 0 || to >= picks.length || from === to) return
    setPicks((current) => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  async function saveOrder() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/featured.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: picks.map((item) => item.id) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || t.auth.fail)
      setNotice(t.admin.orderSaved)
      const list = await load()
      setPicks(list.filter((item) => Number.isFinite(item.featuredOrder) && item.featuredOrder > 0).sort((a, b) => a.featuredOrder - b.featuredOrder))
    } catch (err) {
      const message = err?.message || t.auth.fail
      setError(message.includes('featured_order') ? t.admin.migrate : message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/admin/logout.php', { method: 'POST', credentials: 'include' }).catch(() => {})
    nav('/')
  }

  if (!ready) {
    return <main className="studio"><p className="studio-note">{t.admin.loading}</p></main>
  }

  const visible = showAll ? photos : photos.slice(0, 4)
  const extra = Math.max(0, photos.length - 4)
  const mosaic = photos.length <= 1 ? 'is-1' : photos.length === 2 ? 'is-2' : photos.length === 3 ? 'is-3' : 'is-more'

  return (
    <main className="studio">
      <header className="studio-head">
        <Link className="auth-back" to="/">{t.auth.back}</Link>
        <div className="studio-titles">
          <h1 className="studio-title">{t.admin.title}</h1>
          <p className="studio-note">{t.admin.lead}</p>
        </div>
        <button type="button" className="studio-text" onClick={logout}>{t.nav.logout}</button>
      </header>
      {notice ? <p className="studio-toast" role="status">{notice}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <div className="studio-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'works'} className={tab === 'works' ? 'is-on' : ''} onClick={() => setTab('works')}>{t.admin.worksTab}</button>
        <button type="button" role="tab" aria-selected={tab === 'selected'} className={tab === 'selected' ? 'is-on' : ''} onClick={() => setTab('selected')}>{t.admin.selectedTab}</button>
      </div>

      {tab === 'selected' ? (
        <section className="picked" aria-label={t.admin.selectedTab}>
          <p className="studio-note">{t.admin.selectedLead}</p>
          <ol className="picked-slots">
            {Array.from({ length: 5 }, (_, index) => {
              const item = picks[index]
              return (
                <li
                  key={item ? item.id : `empty-${index}`}
                  className={item ? 'picked-slot' : 'picked-slot is-empty'}
                  draggable={Boolean(item)}
                  onDragStart={() => { pickDrag.current = index }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { if (item) movePick(pickDrag.current, index); pickDrag.current = null }}
                >
                  <span className="picked-num">{index + 1}</span>
                  {item ? (
                    <>
                      {item.image ? <img src={item.image} alt="" /> : <span className="studio-item-empty" />}
                      <span className="picked-title">{item.title}</span>
                      <span className="picked-actions">
                        <button type="button" onClick={() => movePick(index, index - 1)} disabled={index === 0} aria-label={t.admin.moveUp}>↑</button>
                        <button type="button" onClick={() => movePick(index, index + 1)} disabled={index === picks.length - 1} aria-label={t.admin.moveDown}>↓</button>
                        <button type="button" onClick={() => setPicks((current) => current.filter((entry) => entry.id !== item.id))}>{t.admin.removePick}</button>
                      </span>
                    </>
                  ) : <span className="studio-note">{t.admin.slotEmpty}</span>}
                </li>
              )
            })}
          </ol>
          <button type="button" className="cta cta--primary" onClick={saveOrder} disabled={busy}>{busy ? t.admin.saving : t.admin.saveOrder}</button>
          <ul className="studio-items">
            {items.map((item) => {
              const chosen = picks.some((entry) => entry.id === item.id)
              const full = picks.length >= 5
              return (
                <li key={item.id} className="studio-item">
                  {item.image ? <img src={item.image} alt="" /> : <span className="studio-item-empty" />}
                  <div>
                    <p className="studio-item-title">{item.title}</p>
                    <p className="studio-item-meta">{item.category}</p>
                  </div>
                  <button type="button" className="studio-text" disabled={chosen || full} onClick={() => addPick(item)}>
                    {chosen ? t.admin.added : (full ? t.admin.full : t.admin.addTop)}
                  </button>
                </li>
              )
            })}
          </ul>
          {items.length === 0 ? <p className="studio-empty">{t.admin.empty}</p> : null}
        </section>
      ) : null}

      {tab === 'works' && draft ? (
        <form
          className="composer"
          onSubmit={publish}
          onPaste={(event) => {
            const files = [...event.clipboardData.files]
            if (files.length) addFiles(files)
          }}
        >
          <h2>{draft.id ? t.admin.edit : t.admin.add}</h2>
          <div
            className="composer-photos"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }}
          >
            {photos.length === 0 ? (
              <button type="button" className="composer-add" onClick={() => fileRef.current?.click()}>
                <strong>{t.admin.drop}</strong>
                <span>{t.admin.photosHint}</span>
                <span>{t.admin.limit}</span>
              </button>
            ) : (
              <div className={`composer-grid ${mosaic}`}>
                {visible.map((photo, index) => (
                  <div
                    key={photo.key}
                    className="composer-tile"
                    draggable
                    onDragStart={() => { dragFrom.current = index }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => { movePhoto(dragFrom.current, index); dragFrom.current = null }}
                  >
                    <img src={photo.url} alt="" />
                    {index === 0 ? <span className="composer-cover">{t.admin.cover}</span> : (
                      <button type="button" className="composer-star" onClick={() => movePhoto(index, 0)} aria-label={t.admin.cover}>★</button>
                    )}
                    <button type="button" className="composer-x" onClick={() => removePhoto(photo.key)} aria-label={t.admin.removePhoto}>×</button>
                    {photo.progress != null && photo.progress < 100 ? <span className="composer-progress" style={{ width: `${photo.progress}%` }} /> : null}
                    {!showAll && index === 3 && extra > 0 ? (
                      <button type="button" className="composer-more" onClick={() => setShowAll(true)}>+{extra}</button>
                    ) : null}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <button type="button" className="composer-more-add" onClick={() => fileRef.current?.click()}>+</button>
                ) : null}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(event) => { addFiles(event.target.files); event.target.value = '' }}
            />
          </div>
          <input className="composer-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t.admin.titleField} maxLength={200} required aria-label={t.admin.titleField} />
          <textarea className="composer-about" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={t.admin.whats} maxLength={500} rows={3} aria-label={t.admin.description} />
          <div className="composer-chips" role="group" aria-label={t.admin.category}>
            {WORK_CATEGORIES.map((category) => (
              <button key={category} type="button" className={draft.category === category ? 'is-on' : ''} aria-pressed={draft.category === category} onClick={() => setDraft({ ...draft, category })}>{category}</button>
            ))}
          </div>
          <button type="button" className="composer-links-toggle" aria-expanded={linksOpen} onClick={() => setLinksOpen((open) => !open)}>{t.admin.linksToggle}</button>
          {linksOpen ? (
            <div className="composer-links">
              <ul>
                {(draft.links || []).map((link) => <li key={link.id}>{link.type}: {link.url}</li>)}
              </ul>
              {draft.id ? (
                <div className="studio-link-row">
                  <select className="auth-input auth-select" value={linkType} onChange={(event) => setLinkType(event.target.value)} aria-label={t.admin.link}>
                    {LINK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input className="auth-input" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder={t.admin.linkPh} />
                  <button type="button" onClick={addLink}>{t.admin.addLink}</button>
                </div>
              ) : <p className="studio-note">{t.admin.galleryHint}</p>}
            </div>
          ) : null}
          <div className="studio-form-actions">
            <button className="cta cta--primary" type="submit" disabled={busy}>{busy ? t.admin.publishing : t.admin.publish}</button>
            <button type="button" className="studio-text" onClick={() => setDraft(null)}>{t.admin.cancel}</button>
          </div>
        </form>
      ) : null}
      {tab === 'works' && !draft ? (
        <button type="button" className="composer-launch" onClick={openNew}>{t.admin.drop}</button>
      ) : null}

      {tab === 'works' ? <section className="studio-list" aria-label={t.admin.title}>
        {items.length === 0 ? <p className="studio-empty">{t.admin.empty}</p> : null}
        <ul className="studio-items">
          {items.map((item) => (
            <li key={item.id} className="studio-item">
              {item.image ? <img src={item.image} alt="" /> : <span className="studio-item-empty" />}
              <div>
                <p className="studio-item-title">{item.title}</p>
                <p className="studio-item-meta">{item.category}{item.featuredOrder ? ` · ${item.featuredOrder}` : ''}</p>
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
      </section> : null}
    </main>
  )
}
