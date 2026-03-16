import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const PortfolioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isPortfolio = location.pathname === '/portfolio'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', menuOpen)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <Link to="/" className="logo" aria-label="Početna">
        <img src="/slike/VisoraLogo.png" alt="Visora Digital" className="logo-img" />
      </Link>
      <button
        type="button"
        className="hamburger"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
      <nav className="nav">
        <Link to="/#about" className="nav-link">about</Link>
        <Link to="/#contact" className="nav-link">contact</Link>
        <Link
          to="/portfolio"
          className={`nav-icon ${isPortfolio ? 'nav-icon--active' : ''}`}
          aria-label="Portfolio"
        >
          <PortfolioIcon />
        </Link>
      </nav>
      <div className="mobile-menu" aria-hidden={!menuOpen}>
        <div className="mobile-menu-backdrop" onClick={closeMenu} />
        <div className="mobile-menu-panel">
          <Link to="/#about" className="mobile-menu-link" onClick={closeMenu}>about</Link>
          <Link to="/#contact" className="mobile-menu-link" onClick={closeMenu}>contact</Link>
          <Link to="/portfolio" className="mobile-menu-link" onClick={closeMenu}>portfolio</Link>
        </div>
      </div>
    </header>
  )
}
