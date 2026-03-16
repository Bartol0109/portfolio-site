import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import DarkVeil from '../components/DarkVeil'
import Geo from '../components/Geo'
import Sidebar from '../components/Sidebar'

const ABOUT_TAGS = [
  'Front-end', 'Full-stack', 'Web', 'Unity', 'C#', 'Video Edit', 'Photo Edit',
  'Database Management', 'MS Office', 'Adobe',
]

export default function Home() {
  const logoWrapRef = useRef(null)
  const logoImgRef = useRef(null)

  useEffect(() => {
    const wrap = logoWrapRef.current
    const img = logoImgRef.current
    if (!wrap || !img) return
    const maxTilt = 12
    const setTilt = (e) => {
      const rect = wrap.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rotateY = (x - 0.5) * 2 * maxTilt
      const rotateX = (0.5 - y) * 2 * maxTilt
      img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }
    const resetTilt = () => { img.style.transform = 'rotateX(0deg) rotateY(0deg)' }
    wrap.addEventListener('mousemove', setTilt)
    wrap.addEventListener('mouseleave', resetTilt)
    return () => {
      wrap.removeEventListener('mousemove', setTilt)
      wrap.removeEventListener('mouseleave', resetTilt)
    }
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view')
        })
      },
      { rootMargin: '0px 0px -25% 0px', threshold: 0.05 }
    )
    els.forEach((el) => observer.observe(el))
    return () => els.forEach((el) => observer.unobserve(el))
  }, [])

  return (
    <>
      <DarkVeil />
      <Geo />
      <div className="vertical-label vertical-label--role">designer / developer</div>

      <main className="main">
        <section className="hero">
          <h1 className="hero-name">Bartol Barać</h1>
          <p className="hero-subtitle">bacc.ing. Multimedia Computing</p>
          <p className="hero-desc">
            Multimedia Computing graduate focused on full-stack web development and creating engaging digital experiences. Based in Croatia.
          </p>
          <p className="hero-desc hero-brand">
            Visora Digital is a personal brand focused on web development, game development, design, and digital content creation.
          </p>
          <div className="cta-group">
            <Link to="/#about" className="cta">
              <span className="cta-text">find out more</span>
              <span className="cta-circle" />
            </Link>
            <Link to="/portfolio" className="cta">
              <span className="cta-text">portfolio projects</span>
              <span className="cta-circle" />
            </Link>
          </div>
        </section>
        <div className="hero-image-wrap hero-logo-3d" ref={logoWrapRef} id="hero-logo-wrap">
          <img
            ref={logoImgRef}
            src="/slike/VisoraLogo.png"
            alt="Visora Digital"
            className="hero-image hero-image--logo"
            id="hero-logo-img"
          />
        </div>
      </main>

      <section id="about" className="page-section page-section--about">
        <div className="section-inner section-inner--about reveal">
          <h2 className="section-title">About</h2>
          <p className="about-intro">
            I'm a Multimedia Computing graduate with a focus on building things for the web — from clean interfaces to the logic behind them. I like turning ideas into working, user-friendly products.
          </p>
          <div className="about-block">
            <h3 className="about-subtitle">What I do</h3>
            <p className="section-text">
              Full-stack web developer with a strong front-end focus (React, Node.js, modern CSS) and hands-on back-end experience (SQL, PHP, REST APIs), combining development and creative production. I have experience in C# and game development (Unity), as well as graphic design, promotional content creation, and video editing.
            </p>
          </div>
          <div className="about-block">
            <h3 className="about-subtitle">Background</h3>
            <p className="section-text">
              I graduated from the Graphic School in Zadar, after which I enrolled in the Multimedia Computing program at Algebra Bernays University, where I earned my Bachelor's degree (Bacc. Ing.). During my studies, I developed practical skills in web development, multimedia, and digital production, which I applied through freelance and side projects. I am open to both on-site and remote work opportunities.
            </p>
          </div>
          <div className="about-block">
            <h3 className="about-subtitle">Outside of code</h3>
            <p className="section-text">
              Enthusiast in martial arts (boxing, jiu-jitsu). I create solo projects like mini-games and mobile apps in React Native.
            </p>
          </div>
          <div className="about-tags">
            {ABOUT_TAGS.map((tag) => (
              <span key={tag} className="about-tag">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="page-section page-section--contact">
        <div className="section-inner section-inner--contact reveal">
          <h2 className="section-title">Contact</h2>
          <p className="contact-intro">
            Send a message — I'll get back to you.{' '}
            <a href="mailto:bartolbarac@outlook.com" className="contact-email-link">bartolbarac@outlook.com</a>
          </p>
          <form className="contact-form" action="https://formspree.io/f/xbdzkwjj" method="POST">
            <input type="hidden" name="_subject" value="New message from bartolbarac.com" />
            <label className="contact-label" htmlFor="contact-name">Name</label>
            <input type="text" id="contact-name" name="name" className="contact-input" required placeholder="Your name" />
            <label className="contact-label" htmlFor="contact-email">Email</label>
            <input type="email" id="contact-email" name="email" className="contact-input" required placeholder="you@email.com" />
            <label className="contact-label" htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" className="contact-input contact-textarea" required placeholder="Your message..." rows={5} />
            <button type="submit" className="contact-submit">Send</button>
          </form>
          <p className="contact-credit">
            Contact form powered by <a href="https://formspree.io" target="_blank" rel="noopener noreferrer">Formspree</a>.
          </p>
        </div>
      </section>

      <Sidebar />
      <div className="bg-watermark" aria-hidden="true">Welcome</div>
    </>
  )
}
