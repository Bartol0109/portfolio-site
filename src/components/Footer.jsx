import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const year = new Date().getFullYear()
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-logo">{t.footer.brand}</Link>
        <p className="footer-copy">&copy; <span>{year}</span> Bartol Barać</p>
        <nav className="footer-nav">
          <Link to="/#about">{t.footer.about}</Link>
          <Link to="/#contact">{t.footer.contact}</Link>
          <Link to="/blog">{t.footer.blog}</Link>
          <Link to="/portfolio">{t.footer.portfolio}</Link>
        </nav>
      </div>
    </footer>
  )
}
