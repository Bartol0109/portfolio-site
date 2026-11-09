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
  const drawerRef = useRef(null)
  const edgeRef = useRef(null)
  const leaveTimer = useRef(0)
  const blockHover = useRef(false)
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 980px)').matches)
  const [pinned, setPinned] = useState(false)
  const [hot, setHot] = useState(false)
  const navOpen = isDesktop && (pinned || hot)

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

  useEffect(() => () => {
    window.clearTimeout(hold.current.timer)
    window.clearTimeout(leaveTimer.current)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 980px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const clearLeave = () => window.clearTimeout(leaveTimer.current)

  const closeDesktopNav = () => {
    clearLeave()
    setPinned(false)
    setHot(false)
  }

  const revealDesktopNav = () => {
    if (!isDesktop || blockHover.current) return
    clearLeave()
    setHot(true)
  }

  const scheduleDesktopClose = () => {
    if (!isDesktop) return
    clearLeave()
    leaveTimer.current = window.setTimeout(() => setHot(false), 280)
  }

  const toggleDesktopNav = () => {
    if (navOpen) {
      blockHover.current = true
      closeDesktopNav()
      return
    }
    blockHover.current = false
    setPinned(true)
  }

  useEffect(() => {
    if (!navOpen) return undefined
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      blockHover.current = true
      closeDesktopNav()
      edgeRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

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
    <header className={`header${scrolled ? ' header--scrolled' : ''}${navOpen ? ' is-nav-open' : ''}`}>
      <a className="skip-link" href="#content">{t.nav.skip}</a>
      <div
        className="nav-drawer"
        ref={drawerRef}
        onPointerEnter={revealDesktopNav}
        onPointerLeave={scheduleDesktopClose}
        onFocusCapture={revealDesktopNav}
        onBlurCapture={(e) => {
          if (!drawerRef.current?.contains(e.relatedTarget)) scheduleDesktopClose()
        }}
      >
        <button
          type="button"
          className="nav-edge"
          ref={edgeRef}
          hidden={!isDesktop}
          aria-expanded={navOpen}
          aria-controls="site-nav"
          aria-label={navOpen ? t.nav.close : t.nav.navigation}
          onClick={toggleDesktopNav}
          onPointerLeave={() => { blockHover.current = false }}
          onBlur={() => { blockHover.current = false }}
        >
          <span className="nav-edge-plate">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 2.5 9.5 7 5 11.5" />
            </svg>
          </span>
          <span className="nav-edge-label" aria-hidden="true">{t.nav.navigation}</span>
        </button>
        <div id="site-nav" className="nav-panel" aria-hidden={isDesktop && !navOpen}>
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
            <span className="logo-mark">
              <img src="/slike/Profilna.jpg" alt="" />
            </span>
            <span className="logo-word">Bartol</span>
          </Link>
          <div className="header-end">
            <nav className="nav" aria-label={t.nav.home}>
              <Link to="/#about" className="nav-link">{t.nav.about}</Link>
              <Link to="/#contact" className="nav-link">{t.nav.contact}</Link>
              <Link to="/blog" className="nav-link">{t.nav.blog}</Link>
              <Link
                to="/portfolio"
                className={`nav-link${isPortfolio ? ' nav-link--active' : ''}`}
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
        </div>
      </div>
      <button
        type="button"
        className="nav-backdrop"
        tabIndex={-1}
        aria-hidden="true"
        onClick={closeDesktopNav}
      />
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
          <div className="mobile-menu-langs">
            <button
              type="button"
              className={`mobile-menu-lang${lang === 'hr' ? ' is-active' : ''}`}
              aria-pressed={lang === 'hr'}
              onClick={() => { if (lang !== 'hr') { toggle(); closeMenu() } }}
            >
              HR
            </button>
            <button
              type="button"
              className={`mobile-menu-lang${lang === 'en' ? ' is-active' : ''}`}
              aria-pressed={lang === 'en'}
              onClick={() => { if (lang !== 'en') { toggle(); closeMenu() } }}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
