import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { lang, t, toggle } = useLanguage()
  const isPortfolio = location.pathname === '/portfolio' || location.pathname.startsWith('/portfolio/')
  const otherLang = lang === 'en' ? 'HR' : 'EN'
  const hold = useRef({ timer: 0, opened: false })
  const [holding, setHolding] = useState(false)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    let alive = true
    async function check() {
      try {
        const res = await fetch('/api/admin/me.php', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!alive) return
        setIsAdmin(Boolean(res.ok && data?.ok))
      } catch {
        if (!alive) return
        setIsAdmin(false)
      }
    }
    check()
    return () => { alive = false }
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', menuOpen)
    if (!menuOpen) return undefined
    const root = menuRef.current
    const focusable = () => (root ? [...root.querySelectorAll('a, button')] : [])
    const id = window.setTimeout(() => focusable()[0]?.focus(), 20)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const clearHold = () => {
    window.clearTimeout(hold.current.timer)
    setHolding(false)
  }

  useEffect(() => () => window.clearTimeout(hold.current.timer), [])

  const onLogoPointerDown = (e) => {
    if (e.button !== 0) return
    hold.current.opened = false
    setHolding(true)
    hold.current.timer = window.setTimeout(() => {
      hold.current.opened = true
      setHolding(false)
      navigate('/admin/login')
    }, 800)
  }

  const goLanding = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    clearHold()
    if (hold.current.opened) {
      hold.current.opened = false
      return
    }
    closeMenu()
    if (location.pathname !== '/' || location.hash) navigate('/')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  async function logout() {
    try {
      await fetch('/api/admin/logout.php', { method: 'POST', credentials: 'include' })
    } finally {
      setIsAdmin(false)
      navigate('/')
    }
  }

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <a className="skip-link" href="#content">{t.nav.skip}</a>
      <Link
        to="/"
        className={`logo${holding ? ' is-hold' : ''}`}
        aria-label="Bartol Barać"
        onClick={goLanding}
        onPointerDown={onLogoPointerDown}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
      >
        <span className="logo-mark" aria-hidden="true">B</span>
        <span className="logo-word">Bartol</span>
      </Link>
      <div className="header-end">
        <nav className="nav" aria-label={t.nav.home}>
          <Link to="/#about" className="nav-link nav-index">{t.nav.about}</Link>
          <Link to="/#contact" className="nav-link nav-index">{t.nav.contact}</Link>
          <Link to="/blog" className="nav-link nav-index">{t.nav.blog}</Link>
          <Link
            to="/portfolio"
            className={`nav-link nav-index${isPortfolio ? ' nav-link--active' : ''}`}
            aria-current={isPortfolio ? 'page' : undefined}
          >
            {t.nav.portfolio}
          </Link>
          {isAdmin ? (
            <button type="button" className="nav-link nav-link--button nav-link--quiet" onClick={logout}>{t.nav.logout}</button>
          ) : null}
        </nav>
        <button
          type="button"
          className="nav-link nav-link--button nav-lang"
          onClick={toggle}
          aria-label={t.nav.switchLang}
        >
          {otherLang}
        </button>
        <button
          type="button"
          className="hamburger"
          aria-label={menuOpen ? t.nav.close : t.nav.menu}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuButtonRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>
      <div
        id="site-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        ref={menuRef}
        hidden={!menuOpen}
      >
        <div className="mobile-menu-backdrop" onClick={closeMenu} />
        <div
          className="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.menu}
        >
          <Link to="/#about" className="mobile-menu-link" onClick={closeMenu}>{t.nav.about}</Link>
          <Link to="/#contact" className="mobile-menu-link" onClick={closeMenu}>{t.nav.contact}</Link>
          <Link to="/blog" className="mobile-menu-link" onClick={closeMenu}>{t.nav.blog}</Link>
          <Link to="/portfolio" className="mobile-menu-link" onClick={closeMenu} aria-current={isPortfolio ? 'page' : undefined}>{t.nav.portfolio}</Link>
          {isAdmin ? (
            <button
              type="button"
              className="mobile-menu-link mobile-menu-link--button mobile-menu-link--quiet"
              onClick={async () => { await logout(); closeMenu() }}
            >
              {t.nav.logout}
            </button>
          ) : null}
          <button
            type="button"
            className="mobile-menu-link mobile-menu-link--button nav-lang"
            onClick={() => { toggle(); closeMenu() }}
            aria-label={t.nav.switchLang}
          >
            {otherLang}
          </button>
        </div>
      </div>
    </header>
  )
}
