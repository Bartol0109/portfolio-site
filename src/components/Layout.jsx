import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const isPortfolio = location.pathname === '/portfolio'

  useEffect(() => {
    document.title = isPortfolio ? 'Visora Digital I Portfolio' : 'Visora Digital I Welcome'
    document.body.classList.toggle('portfolio-page', isPortfolio)
  }, [isPortfolio])

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('page-loaded')
      })
    })
  }, [])

  useEffect(() => {
    const hash = location.hash
    if (hash) {
      const el = document.querySelector(hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [location.pathname, location.hash])

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
