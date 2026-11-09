import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AboutDeck from '../components/AboutDeck'
import Sidebar from '../components/Sidebar'
import { useLanguage } from '../i18n/LanguageContext'
import { projectText } from '../i18n/translations'
import { contactFormAction, isDevPreview } from '../lib/devGuard'
import { useReveal } from '../lib/useReveal'

const PICKS = [
  { id: 'p1', title: 'Construction Company Website', year: '2026', image: '/slike/Portfolio1.jpeg', category: 'Web Design' },
  { id: 'p4', title: 'Full-stack Application', year: '2025', image: '/slike/Portfolio4.jpeg', category: 'College Project' },
  { id: 'p6', title: '2D Game Development', year: '2026', image: '/slike/Portfolio6.png', category: 'Game Development' },
]

const SOCIAL = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/bartol-barac',
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Bartol0109',
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:bartolbarac@outlook.com',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
]

function WorkShow({ projects, t }) {
  const [index, setIndex] = useState(0)
  const [reduce, setReduce] = useState(false)
  const [paused, setPaused] = useState(false)
  const rootRef = useRef(null)
  const dragX = useRef(null)
  const swiped = useRef(false)
  const count = projects.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reduce || paused || count < 2) return undefined
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => window.clearInterval(id)
  }, [reduce, paused, count])

  const go = (next) => setIndex(((next % count) + count) % count)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(index - 1)
    }
  }

  return (
    <div
      className="show"
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.selected.show}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget)) setPaused(false)
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className="show-frame"
        onPointerDown={(e) => { dragX.current = e.clientX }}
        onPointerUp={(e) => {
          if (dragX.current == null) return
          const dx = e.clientX - dragX.current
          dragX.current = null
          if (Math.abs(dx) > 48) {
            swiped.current = true
            go(dx > 0 ? index - 1 : index + 1)
          }
        }}
        onClickCapture={(e) => {
          if (!swiped.current) return
          e.preventDefault()
          e.stopPropagation()
          swiped.current = false
        }}
        onPointerCancel={() => { dragX.current = null }}
      >
        {projects.map((project, i) => {
          const text = projectText(t, project)
          const on = i === index
          return (
            <Link
              key={project.id}
              className={`show-slide${on ? ' is-on' : ''}`}
              to={`/portfolio/${project.id}`}
              state={{ project }}
              aria-hidden={!on}
              tabIndex={on ? 0 : -1}
            >
              <span className="show-photo">
                <img src={project.image} alt="" />
              </span>
              <span className="show-copy">
                <span className="show-meta">{text.category} · {project.year}</span>
                <span className="show-title">{project.title}</span>
                <span className="show-tag">{text.description}</span>
              </span>
            </Link>
          )
        })}
      </div>
      <div className="show-controls">
        <button type="button" className="show-arrow" aria-label={t.selected.prev} onClick={() => go(index - 1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <div className="show-dots">
          {projects.map((project, i) => (
            <button
              key={project.id}
              type="button"
              className={i === index ? 'is-on' : ''}
              aria-label={`${t.selected.dot}: ${project.title}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button type="button" className="show-arrow" aria-label={t.selected.next} onClick={() => go(index + 1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function HeroKicker({ lines }) {
  const [shown, setShown] = useState('')
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reduce || lines.length === 0) return undefined
    let line = 0
    let count = 0
    let deleting = false
    let timer = 0
    const tick = () => {
      const full = lines[line]
      if (!deleting) {
        count += 1
        setShown(full.slice(0, count))
        if (count >= full.length) {
          deleting = true
          timer = window.setTimeout(tick, 1700)
          return
        }
        timer = window.setTimeout(tick, 38)
      } else {
        count -= 1
        setShown(full.slice(0, Math.max(count, 0)))
        if (count <= 0) {
          deleting = false
          line = (line + 1) % lines.length
          timer = window.setTimeout(tick, 260)
          return
        }
        timer = window.setTimeout(tick, 18)
      }
    }
    timer = window.setTimeout(tick, 280)
    return () => window.clearTimeout(timer)
  }, [lines, reduce])

  return (
    <p className="hero-kicker">
      <span className="sr-only">{lines.join(' ')}</span>
      {reduce ? (
        <span className="hero-kicker-static">
          {lines.map((line) => <span key={line}>{line}</span>)}
        </span>
      ) : (
        <span className="hero-kicker-live" aria-hidden="true">
          {shown}
          <span className="hero-caret" />
        </span>
      )}
    </p>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const preview = isDevPreview()
  const [previewNote, setPreviewNote] = useState(false)
  const heroRef = useRef(null)
  const [motionOk, setMotionOk] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useReveal(t.about.title)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setMotionOk(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = heroRef.current
    if (!el || !motionOk) return undefined
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const setSpot = (x, y) => {
      el.style.setProperty('--spot-x', x)
      el.style.setProperty('--spot-y', y)
    }
    const onPointer = (e) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      setSpot(`${((e.clientX - rect.left) / rect.width) * 100}%`, `${((e.clientY - rect.top) / rect.height) * 100}%`)
    }
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const passed = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)))
      setSpot('68%', `${18 + passed * 50}%`)
    }
    el.addEventListener('pointermove', onPointer)
    if (!fine) {
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
    }
    return () => {
      el.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [motionOk])

  useEffect(() => {
    setPreviewNote(false)
  }, [t.contact.preview])

  function onContactSubmit(e) {
    if (!preview) return
    e.preventDefault()
    setPreviewNote(true)
  }

  return (
    <>
      <div className="landing-wrap">
        <main className="main">
          <section className={`hero${motionOk ? ' hero-live' : ''}`} ref={heroRef}>
            <HeroKicker lines={t.hero.kicker} />
            <div className="hero-mast">
              <figure className="hero-portrait">
                <img src="/slike/Profilna.jpg" alt="" />
              </figure>
              <div className="hero-id">
                <p className="hero-iam">{t.hero.iam}</p>
                <h1 className="hero-name">Bartol Barać</h1>
                <p className="hero-role">
                  <span className="hero-role-quiet">{t.hero.role}</span>{' '}
                  <span className="hero-role-accent">{t.hero.roleAccent}</span>
                </p>
              </div>
            </div>
            <p className="hero-statement">
              {t.hero.statementLead}
              <span className="hero-statement-word">{t.hero.statementWord}{t.hero.statementEnd}<span className="status-dot" aria-hidden="true" /></span>
            </p>
            <ul className="hero-skills" aria-label={t.hero.skillsLabel}>
              {t.orbit.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
            <div className="cta-stack">
              <div className="cta-group">
                <Link to="/portfolio" className="cta cta--primary">{t.hero.work}</Link>
                <a href="#contact" className="cta cta--outline">{t.hero.contact}</a>
              </div>
              <a className="cta cta--cv" href="/Bartol-Barac-CV.pdf" download="Bartol-Barac-CV.pdf">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                {t.hero.cv}
              </a>
              <div className="hero-social">
                <span className="hero-social-label">{t.hero.findMe}</span>
                <div className="hero-social-links">
                  {SOCIAL.map((s) => (
                    <a key={s.label} href={s.href} className="hero-social-link" aria-label={s.label} target={s.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <section className="hero-stats-bar">
          {t.stats.map((s) => (
            <p key={s.num} className="hero-stat">{s.num}</p>
          ))}
        </section>

        <section id="work" className="page-section page-section--work">
          <div className="section-head">
            <h2 className="section-title">{t.selected.title}</h2>
            <p className="section-note">{t.selected.note}</p>
          </div>
          <WorkShow projects={PICKS} t={t} />
          <div className="pick-list">
            {PICKS.map((project, index) => {
              const text = projectText(t, project)
              return (
                <Link key={project.id} to={`/portfolio/${project.id}`} state={{ project }} className="pick">
                  <span className="pick-index">0{index + 1}</span>
                  <span className="pick-copy">
                    <span className="pick-meta">{text.category} · {project.year}</span>
                    <span className="pick-title">{project.title}</span>
                    <span className="pick-desc">{text.description}</span>
                  </span>
                  <span className="pick-shot">
                    <img src={project.image} alt="" />
                  </span>
                </Link>
              )
            })}
          </div>
          <Link to="/portfolio" className="text-link">{t.selected.all}</Link>
        </section>
      </div>

      <section id="about" className="page-section page-section--about">
        <div className="section-inner section-inner--about reveal">
          <h2 className="section-title">{t.about.title}</h2>
          <AboutDeck />
        </div>
      </section>

      <section id="contact" className="page-section page-section--contact">
        <div className="section-inner section-inner--contact reveal">
          <h2 className="section-title">{t.contact.title}</h2>
          <p className="contact-intro">
            {t.contact.intro}{' '}
            <a href="mailto:bartolbarac@outlook.com" className="contact-email-link">bartolbarac@outlook.com</a>
          </p>
          <form
            className="contact-form"
            action={contactFormAction(preview)}
            method="POST"
            onSubmit={onContactSubmit}
          >
            {preview ? null : <input type="hidden" name="_subject" value="New message from bartolbarac.com" />}
            <label className="contact-label" htmlFor="contact-name">{t.contact.name}</label>
            <input type="text" id="contact-name" name="name" className="contact-input" required placeholder={t.contact.namePh} autoComplete="name" />
            <label className="contact-label" htmlFor="contact-email">{t.contact.email}</label>
            <input type="email" id="contact-email" name="email" className="contact-input" required placeholder={t.contact.emailPh} autoComplete="email" />
            <label className="contact-label" htmlFor="contact-message">{t.contact.message}</label>
            <textarea id="contact-message" name="message" className="contact-input contact-textarea" required placeholder={t.contact.messagePh} rows={5} />
            <button type="submit" className="contact-submit">{t.contact.send}</button>
          </form>
          {previewNote ? <p className="contact-preview-note" role="status">{t.contact.preview}</p> : null}
          {preview ? null : (
            <p className="contact-credit">
              {t.contact.credit} <a href="https://formspree.io" target="_blank" rel="noopener noreferrer">Formspree</a>.
            </p>
          )}
        </div>
      </section>

      <Sidebar />
    </>
  )
}
