import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-logo">Visora Digital</Link>
        <p className="footer-copy">&copy; <span>{year}</span> Bartol Barać</p>
        <nav className="footer-nav">
          <Link to="/#about">About</Link>
          <Link to="/#contact">Contact</Link>
          <Link to="/portfolio">Portfolio</Link>
        </nav>
      </div>
    </footer>
  )
}
