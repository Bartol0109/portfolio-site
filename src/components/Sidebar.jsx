import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const indicators = [
  { to: '/', section: 0, label: 'Welcome' },
  { to: '/#about', section: 'about', label: 'About' },
  { to: '/#contact', section: 'contact', label: 'Contact' },
]

export default function Sidebar() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const main = document.querySelector('.main')
    const about = document.getElementById('about')
    const contact = document.getElementById('contact')
    if (!main || !about || !contact) return

    const getIndex = () => {
      const scrollY = window.scrollY
      const viewH = window.innerHeight
      const mainBottom = main.offsetTop + main.offsetHeight
      const aboutBottom = about.offsetTop + about.offsetHeight
      if (scrollY < mainBottom - viewH * 0.4) return 0
      if (scrollY < aboutBottom - viewH * 0.4) return 1
      return 2
    }

    const update = () => requestAnimationFrame(() => setActiveIndex(getIndex()))
    window.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <aside className="sidebar sidebar--right">
      {indicators.map((ind, i) => (
        <Link
          key={ind.section}
          to={ind.to}
          className={`section-indicator ${i === activeIndex ? 'section-indicator--active' : ''}`}
          data-section={ind.section}
          aria-label={ind.label}
        >
          <span className="section-label">{ind.label}</span>
          <span className="section-dot" />
        </Link>
      ))}
    </aside>
  )
}
