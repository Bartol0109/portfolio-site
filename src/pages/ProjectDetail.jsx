import { useEffect, useState } from 'react'
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { projectText } from '../i18n/translations'

const STATIC_PROJECTS = {
  p1: { id: 'p1', category: 'Web Design', title: 'Construction Company Website', description: 'I built a landing page for a construction company. It is meant to be clicked through, not only read.', image: '/slike/Portfolio1.jpeg', year: 2026 },
  p2: { id: 'p2', category: 'College Project', title: 'Javascript Coding', description: 'A JavaScript exercise from class. I added a search field, a filter, and a few objects that move.', image: '/slike/Portfolio2.png', year: 2024 },
  p3: { id: 'p3', category: 'College Project', title: 'Tailwind Project', description: 'A class page in Tailwind. I worked on the layout and on fitting it to a phone.', image: '/slike/Portfolio3.jpeg', year: 2024 },
  p4: { id: 'p4', category: 'College Project', title: 'Full-stack Application', description: 'An apartment rental app from class. I built the screens in React and Tailwind, and connected them to a REST API and a SQL database.', image: '/slike/Portfolio4.jpeg', year: 2025 },
  p5: { id: 'p5', category: 'Web Design', title: 'Personal Portfolio', description: 'This site. React and Vite in front, Tailwind for the layout, PHP and MySQL behind it.', image: '/slike/Portfolio5.png', year: 2025 },
  p6: { id: 'p6', category: 'Game Development', title: '2D Game Development', description: 'My final college project. I made a 2D game in Unity. The game code is C#.', image: '/slike/Portfolio6.png', year: 2026 },
}

const LINK_ICONS = {
  Website: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
    </svg>
  ),
  Drive: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.433 22l4-6.933H22l-4 6.933H4.433zM2 18.067L6 11l4 6.933-4 .001L2 18.067zM8.567 11h8L12 4 8.567 11z"/>
    </svg>
  ),
}

function GallerySection({ project, isAdmin, onGalleryChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [direction, setDirection] = useState('next')
  const gallery = project.gallery || []
  const allImages = [
    ...(project.image ? [{ id: 'main', image: project.image }] : []),
    ...gallery,
  ]

  async function uploadImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (gallery.length >= 5) { setError('Maximum 5 images reached'); return }
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('portfolio_id', String(project.id))
      fd.append('image', file)
      const res = await fetch('/api/portfolio/gallery.php', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      onGalleryChange()
    } catch (err) {
      setError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function removeImage(id) {
    try {
      const res = await fetch(`/api/portfolio/gallery.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Delete failed')
      onGalleryChange()
    } catch {
      setError('Failed to remove image')
    }
  }

  function prev() { setDirection('prev'); setLightbox(i => (i - 1 + allImages.length) % allImages.length) }
  function next() { setDirection('next'); setLightbox(i => (i + 1) % allImages.length) }

  useEffect(() => {
    if (lightbox === null) return
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allImages.length])

  return (
    <div className="project-detail-gallery">
      <div className="gallery-thumbs-row">
        {allImages.map((img, idx) => (
          <div key={img.id} className="gallery-thumb-item">
            <button type="button" className="gallery-thumb-btn" aria-label={project.title || 'Image'} onClick={() => setLightbox(idx)}>
              <img
                src={img.image}
                alt=""
                onError={e => { e.currentTarget.closest('.gallery-thumb-item').style.display = 'none' }}
              />
            </button>
            {isAdmin && img.id !== 'main' && (
              <button className="gallery-thumb-del" onClick={() => removeImage(img.id)}>×</button>
            )}
          </div>
        ))}
        {isAdmin && gallery.length < 20 && (
          <label className={`gallery-thumb-add${uploading ? ' gallery-thumb-add--loading' : ''}`}>
            <span>{uploading ? '…' : '+'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadImage} disabled={uploading} style={{ display: 'none' }} />
          </label>
        )}
      </div>
      {allImages.length === 0 && !isAdmin && <p className="project-detail-empty">No gallery images yet.</p>}
      {error && <p className="status-error">{error}</p>}

      {lightbox !== null && (
        <div className="gl-lb" onClick={() => setLightbox(null)}>
          <button type="button" className="gl-lb-arrow gl-lb-arrow--prev" aria-label="Previous" onClick={e => { e.stopPropagation(); prev() }}>‹</button>
          <div className="gl-lb-img-wrap" onClick={e => e.stopPropagation()}>
            <img key={lightbox} src={allImages[lightbox].image} alt="" className={`gl-lb-img gl-lb-img--${direction}`} />
            <button type="button" className="gl-lb-close" aria-label="Close" onClick={() => setLightbox(null)}>×</button>
          </div>
          <button type="button" className="gl-lb-arrow gl-lb-arrow--next" aria-label="Next" onClick={e => { e.stopPropagation(); next() }}>›</button>
          <span className="gl-lb-counter">{lightbox + 1} / {allImages.length}</span>
          {isAdmin && allImages[lightbox].id !== 'main' && (
            <button className="gl-lb-delete" onClick={e => { e.stopPropagation(); removeImage(allImages[lightbox].id) }} title="Remove">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LinksSection({ project, isAdmin, onLinksChange }) {
  const [type, setType] = useState('Website')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const links = project.links || []

  async function addLink(e) {
    e.preventDefault()
    const trimUrl = url.trim()
    if (!trimUrl) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/portfolio/links.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio_id: project.id, type, url: trimUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to add link')
      setUrl('')
      onLinksChange()
    } catch (err) {
      setError(err?.message || 'Failed to add link')
    } finally {
      setSaving(false)
    }
  }

  async function removeLink(id) {
    try {
      const res = await fetch(`/api/portfolio/links.php?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Delete failed')
      onLinksChange()
    } catch {
      setError('Failed to remove link')
    }
  }

  return (
    <div className="project-detail-links">
      {links.length > 0 ? (
        <div className="project-links-list">
          {links.map(link => (
            <div key={link.id} className="project-link-item">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="project-link-btn">
                {LINK_ICONS[link.type]}
                <span>{link.type}</span>
              </a>
              {isAdmin && (
                <button className="project-link-remove" onClick={() => removeLink(link.id)} title="Remove">×</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAdmin && <p className="project-detail-empty">No links added yet.</p>
      )}
      {isAdmin && (
        <form className="project-links-form" onSubmit={addLink}>
          <select className="auth-input auth-select project-links-type" value={type} onChange={e => setType(e.target.value)}>
            <option value="Website">Website</option>
            <option value="Github">Github</option>
            <option value="Drive">Drive</option>
          </select>
          <input className="auth-input project-links-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" required maxLength={255} />
          <button className="status-button project-links-submit" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Link'}</button>
          {error && <p className="status-error">{error}</p>}
        </form>
      )}
    </div>
  )
}

const CATEGORIES = ['Web Sites', 'Mobile Apps', 'Graphic Designs', 'College Projects', 'Game Development']

export default function ProjectDetail() {
  const { t } = useLanguage()
  const { state } = useLocation()
  const { id } = useParams()
  const [project, setProject] = useState(state?.project || STATIC_PROJECTS[id] || null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [draft, setDraft] = useState({ title: '', description: '', category: '', tags: [] })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const numId = !String(id).startsWith('p') ? Number(id) : NaN

  function loadProject() {
    if (!Number.isNaN(numId)) {
      fetch('/api/portfolio.php')
        .then(r => r.json())
        .then(data => {
          const found = data?.items?.find(it => it.id === numId)
          if (found) {
            const p = {
              id: found.id,
              category: found.category,
              title: found.title,
              description: found.description || '',
              tags: found.tags || [],
              image: found.image || '',
              gallery: found.gallery || [],
              links: found.links || [],
            }
            setProject(p)
            setDraft({ title: p.title, description: p.description, category: p.category, tags: p.tags || [] })
          }
        })
        .catch(() => {})
    }
  }

  useEffect(() => {
    if (project) setDraft({ title: project.title, description: project.description || '', category: project.category, tags: project.tags || [] })
  }, [project?.id])

  useEffect(() => {
    if (project && !Number.isNaN(numId)) {
      loadProject()
    } else if (!project && !Number.isNaN(numId)) {
      loadProject()
    }
  }, [id])

  useEffect(() => {
    let alive = true
    fetch('/api/admin/me.php', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (alive && data?.ok) setIsAdmin(true) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  async function saveProject(e) {
    e.preventDefault()
    setSaving(true)
    setSaveStatus(null)
    try {
      const fd = new FormData()
      fd.append('id', String(project.id))
      fd.append('category', draft.category)
      fd.append('title', draft.title)
      fd.append('description', draft.description)
      fd.append('tags', draft.tags.join(','))
      const res = await fetch('/api/portfolio.php', { method: 'POST', credentials: 'include', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Save failed')
      }
      setProject(p => ({ ...p, title: draft.title, description: draft.description, category: draft.category, tags: draft.tags }))
      setSaveStatus('ok')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (err) {
      setSaveStatus(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProject() {
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/portfolio.php?id=${project.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Delete failed')
      }
      navigate('/portfolio')
    } catch (err) {
      alert(err?.message || 'Delete failed')
      setDeleting(false)
    }
  }

  if (!project) {
    return (
      <main className="project-detail-main">
        <Link to="/portfolio" className="project-detail-back">← {t.portfolio.back}</Link>
        <p className="project-detail-notfound">{t.portfolio.notFound}</p>
      </main>
    )
  }

  const isDbProject = !String(project.id).startsWith('p')
  const text = projectText(t, project)

  return (
    <main className="project-detail-main">
      <div className="project-detail-inner">
        <Link to="/portfolio" className="project-detail-back">← {t.portfolio.back}</Link>

        <div className="project-detail-heading">
          {isAdmin && isDbProject ? (
            <select
              className="auth-input auth-select project-edit-category"
              value={draft.category}
              onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <span className="project-bin-category">{text.category}{project.year ? ` · ${project.year}` : ''}</span>
          )}
          {isAdmin && isDbProject ? (
            <input
              className="auth-input project-edit-title"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              maxLength={200}
            />
          ) : (
            <h1 className="project-detail-title">{project.title}</h1>
          )}
        </div>

        {isDbProject && (draft.tags.length > 0 || isAdmin) && (
          <div className="project-tags-row">
            {(isAdmin ? draft.tags : project.tags || []).map((tag, i) => (
              <span key={i} className="project-tag">
                {tag}
                {isAdmin && (
                  <button className="project-tag-remove" onClick={() => setDraft(d => ({ ...d, tags: d.tags.filter((_, idx) => idx !== i) }))}>×</button>
                )}
              </span>
            ))}
            {isAdmin && (
              <form className="project-tag-form" onSubmit={e => {
                e.preventDefault()
                const val = tagInput.trim()
                if (val && !draft.tags.includes(val) && draft.tags.length < 10) {
                  setDraft(d => ({ ...d, tags: [...d.tags, val] }))
                  setTagInput('')
                }
              }}>
                <input
                  className="project-tag-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add tag…"
                  maxLength={30}
                />
              </form>
            )}
          </div>
        )}

        {project.image && (
          <div className="project-detail-hero-img">
            <img src={project.image} alt={project.title} className="project-detail-img" />
          </div>
        )}

        <div className="project-detail-content-row">
          <div className="project-detail-desc-col">
            <p className="project-detail-section-label">{t.portfolio.description}</p>
            {isAdmin && isDbProject ? (
              <textarea
                className="auth-input project-edit-desc"
                value={draft.description}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                maxLength={500}
                rows={5}
              />
            ) : (
              <p className="project-detail-desc">{text.description}</p>
            )}
          </div>
          {isDbProject && (
            <div className="project-detail-links-col">
              <p className="project-detail-section-label">{t.portfolio.links}</p>
              <LinksSection project={project} isAdmin={isAdmin} onLinksChange={loadProject} />
            </div>
          )}
        </div>

        {isDbProject && (
          <div className="project-detail-gallery-full">
            <p className="project-detail-section-label">{t.portfolio.gallery}</p>
            <GallerySection project={project} isAdmin={isAdmin} onGalleryChange={loadProject} />
          </div>
        )}

        {isAdmin && isDbProject && (
          <div className="project-save-row">
            <button className="status-button project-save-btn" onClick={saveProject} disabled={saving || deleting}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="project-delete-btn" onClick={deleteProject} disabled={saving || deleting}>
              {deleting ? 'Deleting…' : 'Delete Project'}
            </button>
            {saveStatus === 'ok' && <span className="project-save-ok">Saved</span>}
            {saveStatus && saveStatus !== 'ok' && <span className="status-error">{saveStatus}</span>}
          </div>
        )}
      </div>
    </main>
  )
}
