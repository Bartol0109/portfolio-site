import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import SiteBackground from './SiteBackground'
import { useLanguage } from '../i18n/LanguageContext'

export default function Layout() {
  const location = useLocation()
  const { t } = useLanguage()
  const isPortfolio = location.pathname.startsWith('/portfolio')

  useEffect(() => {
    document.title = isPortfolio ? t.titles.portfolio : t.titles.welcome
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t.titles.description)
    document.body.classList.toggle('portfolio-page', isPortfolio)
  }, [location.pathname, isPortfolio, t])

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('page-loaded')
      })
    })
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = reduce ? 'auto' : 'smooth'
    const hash = location.hash
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        const id = window.setTimeout(() => el.scrollIntoView({ behavior, block: 'start' }), 60)
        return () => window.clearTimeout(id)
      }
      return undefined
    }
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, left: 0, behavior })
    }
    return undefined
  }, [location.pathname, location.hash])

  return (
    <>
      <SiteBackground />
      <Header />
      <div id="content" className="page-slot route-enter" key={location.pathname}>
        <Outlet />
      </div>
      <Footer />
    </>
  )
}
