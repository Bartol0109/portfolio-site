import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { projectText } from '../i18n/translations'

const STATIC_PROJECTS = [
  {
    id: 'p1',
    category: 'Web Design',
    title: 'Construction Company Website',
    description: 'I built a landing page for a construction company. It is meant to be clicked through, not only read.',
    image: '/slike/Portfolio1.jpeg',
    year: 2026,
  },
  {
    id: 'p2',
    category: 'College Project',
    title: 'Javascript Coding',
    description: 'A JavaScript exercise from class. I added a search field, a filter, and a few objects that move.',
    image: '/slike/Portfolio2.png',
    year: 2024,
  },
  {
    id: 'p3',
    category: 'College Project',
    title: 'Tailwind Project',
    description: 'A class page in Tailwind. I worked on the layout and on fitting it to a phone.',
    image: '/slike/Portfolio3.jpeg',
    year: 2024,
  },
  {
    id: 'p4',
    category: 'College Project',
    title: 'Full-stack Application',
    description: 'An apartment rental app from class. I built the screens in React and Tailwind, and connected them to a REST API and a SQL database.',
    image: '/slike/Portfolio4.jpeg',
    year: 2025,
  },
  {
    id: 'p5',
    category: 'Web Design',
    title: 'Personal Portfolio',
    description: 'This site. React and Vite in front, Tailwind for the layout, PHP and MySQL behind it.',
    image: '/slike/Portfolio5.png',
    year: 2025,
  },
  {
    id: 'p6',
    category: 'Game Development',
    title: '2D Game Development',
    description: 'My final college project. I made a 2D game in Unity. The game code is C#.',
    image: '/slike/Portfolio6.png',
    year: 2026,
  },
]

function ProjectCard({ project, viewLabel }) {
  const { t } = useLanguage()
  const text = projectText(t, project)
  return (
    <Link to={`/portfolio/${project.id}`} state={{ project }} className="project-bin">
      <div className="project-bin-img-wrap">
        {project.image ? (
          <img src={project.image} alt="" className="project-bin-img" loading="lazy" />
        ) : (
          <div className="project-bin-img project-bin-img--empty" />
        )}
      </div>
      <div className="project-bin-body">
        <div className="project-bin-meta">
          <span className="project-bin-category">{text.category}</span>
          {project.year ? <span className="project-bin-year">{project.year}</span> : null}
        </div>
        <h3 className="project-bin-title">{project.title}</h3>
        <p className="project-bin-desc">{text.description}</p>
        <span className="project-bin-view">{viewLabel}</span>
      </div>
    </Link>
  )
}

export default function Portfolio() {
  const { t } = useLanguage()
  const filterRefs = useRef([])
  const [apiItems, setApiItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filter, setFilter] = useState('All')

  const CATEGORIES = ['Web Sites', 'Mobile Apps', 'Graphic Designs', 'College Projects', 'Game Development']

  const [addCategory, setAddCategory] = useState(CATEGORIES[0])
  const [addTitle, setAddTitle] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addFile, setAddFile] = useState(null)
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState('')

  const loadPortfolio = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio.php')
      const data = await res.json().catch(() => ({}))
      setApiItems(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setApiItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPortfolio() }, [loadPortfolio])

  useEffect(() => {
    let alive = true
    async function check() {
      try {
        const res = await fetch('/api/admin/me.php', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!alive) return
        if (res.ok && data?.ok) { setIsAdmin(true) }
        else { setIsAdmin(false) }
      } catch { if (!alive) return; setIsAdmin(false) }
    }
    check()
    return () => { alive = false }
  }, [])

  const allProjects = useMemo(() => {
    if (apiItems.length > 0) {
      return apiItems.map(it => ({
        id: it.id,
        category: it.category || 'Other',
        title: it.title || '',
        description: it.description || '',
        image: it.image || '',
        gallery: it.gallery || [],
        links: it.links || [],
      }))
    }
    return STATIC_PROJECTS
  }, [apiItems])

  const categories = useMemo(() => ['All', ...new Set(allProjects.map(p => p.category))], [allProjects])
  const filtered = useMemo(() => filter === 'All' ? allProjects : allProjects.filter(p => p.category === filter), [allProjects, filter])

  function onFilterKey(e, index) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % categories.length
    if (e.key === 'ArrowLeft') next = (index - 1 + categories.length) % categories.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = categories.length - 1
    setFilter(categories[next])
    filterRefs.current[next]?.focus()
  }

  async function submitAdd(e) {
    e.preventDefault()
    setFormError('')
    const title = addTitle.trim()
    const desc = addDesc.trim()
    if (!title) { setFormError('Title is required.'); return }
    setAdding(true)
    try {
      const fd = new FormData()
      fd.append('category', addCategory)
      fd.append('title', title)
      fd.append('description', desc)
      if (addFile) fd.append('image', addFile)
      const res = await fetch('/api/portfolio.php', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to add project')
      setAddTitle(''); setAddDesc(''); setAddFile(null)
      await loadPortfolio()
    } catch (err) {
      setFormError(err?.message || 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <main className="portfolio-main">
        <div className="portfolio-header">
          <h1 className="portfolio-title">{t.portfolio.title}</h1>
          <p className="portfolio-intro">{t.portfolio.intro}</p>
          <div className="portfolio-filters" role="toolbar" aria-label={t.portfolio.filters}>
            {categories.map((cat, index) => (
              <button
                key={cat}
                type="button"
                ref={(node) => { filterRefs.current[index] = node }}
                className={`portfolio-filter-btn ${filter === cat ? 'portfolio-filter-btn--active' : ''}`}
                aria-pressed={filter === cat}
                onClick={() => setFilter(cat)}
                onKeyDown={(e) => onFilterKey(e, index)}
              >
                {cat === 'All' ? t.portfolio.all : (t.projectCategories?.[cat] || cat)}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <section className="blog-admin portfolio-admin-panel">
            <form className="status-form portfolio-admin-form" onSubmit={submitAdd}>
              <div className="portfolio-admin-row">
                <label className="auth-label" htmlFor="pf-cat">Category</label>
                <select id="pf-cat" className="auth-input auth-select" value={addCategory} onChange={e => setAddCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="portfolio-admin-row">
                <label className="auth-label" htmlFor="pf-title">Project Name</label>
                <input id="pf-title" className="auth-input" value={addTitle} onChange={e => setAddTitle(e.target.value)} maxLength={200} required />
              </div>
              <label className="auth-label" htmlFor="pf-desc">Description</label>
              <textarea id="pf-desc" className="status-textarea" value={addDesc} onChange={e => setAddDesc(e.target.value)} maxLength={500} rows={3} placeholder="Short description (max 500 chars)" />
              <div className="portfolio-admin-row">
                <label className="auth-label">Main Image</label>
                <label className="file-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>{addFile ? addFile.name : 'Choose image'}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setAddFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                </label>
              </div>
              {formError && <div className="status-error">{formError}</div>}
              <button className="status-button" type="submit" disabled={adding}>{adding ? 'Adding…' : 'Add Project'}</button>
            </form>
          </section>
        )}

        {loading && <div className="updates-loading">{t.portfolio.loading}</div>}

        {!loading && filtered.length === 0 ? (
          <p className="portfolio-empty">{t.portfolio.empty}</p>
        ) : null}

        <div className="portfolio-grid-bins">
          {filtered.map(project => (
            <ProjectCard key={String(project.id)} project={project} viewLabel={t.portfolio.view} />
          ))}
        </div>
      </main>
    </>
  )
}
