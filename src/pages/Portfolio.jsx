import { useState, useEffect } from 'react'
import Geo from '../components/Geo'
import Lightbox from '../components/Lightbox'

const WEB_PROJECTS = [
  {
    id: 'p1',
    img: '/slike/Portfolio1.jpeg',
    title: 'In Progress..',
    desc: 'Creating website for construction company and presenting its interactive landing page. (2026)',
  },
  {
    id: 'p5',
    img: '/slike/Portfolio5.png',
    title: 'Here we are!',
    desc: 'Portfolio page made using HTML, CSS, JavaScript, Formspree, and Google Fonts (Outfit). Just for you, fellow visitor.',
  },
]

const COLLEGE_PROJECTS = [
  {
    id: 'p2',
    img: '/slike/Portfolio2.png',
    title: 'Javascript Coding',
    desc: 'Mini-project in which I showcase basic JavaScript skills like search bar, filter, animated objects. (2024)',
  },
  {
    id: 'p3',
    img: '/slike/Portfolio3.jpeg',
    title: 'Tailwind Project',
    desc: 'Showcasing advanced CSS skills using the Tailwind utility library for responsive, utility-first styling. (2024)',
  },
  {
    id: 'p4',
    img: '/slike/Portfolio4.jpeg',
    title: 'Full-stack application',
    desc: 'Functional apartment rental app with React.js and Tailwind CSS front end, REST API, and SQL database integration. (2025)',
  },
  {
    id: 'p6',
    img: '/slike/Portfolio6.png',
    title: '2D Game Development',
    desc: 'Final College project. Created and developed a functional 2D video game using Unity and C#. (2026)',
  },
]

function ProjectCard({ img, title, desc, onViewImage }) {
  return (
    <article className="project-card">
      <div className="project-card-image">
        <img src={img} alt="" className="project-card-img" />
      </div>
      <div className="project-card-body">
        <h3 className="project-card-title">{title}</h3>
        <p className="project-card-desc">{desc}</p>
        <button
          type="button"
          className="project-card-link"
          onClick={() => onViewImage(img)}
        >
          View project
        </button>
      </div>
    </article>
  )
}

export default function Portfolio() {
  const [lightboxSrc, setLightboxSrc] = useState(null)

  useEffect(() => {
    const els = document.querySelectorAll('.portfolio-section.reveal')
    if (!els.length) return
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
      <Geo />
      <main className="portfolio-main">
        <h1 className="portfolio-title">Portfolio</h1>
        <p className="portfolio-subtitle">Page currently in the works.</p>
        <p className="portfolio-intro">Selection of projects and work.</p>

        <section className="portfolio-section reveal">
          <h2 className="portfolio-section-title">Web Designs</h2>
          <div className="portfolio-grid">
            {WEB_PROJECTS.map((p) => (
              <ProjectCard
                key={p.id}
                img={p.img}
                title={p.title}
                desc={p.desc}
                onViewImage={setLightboxSrc}
              />
            ))}
          </div>
        </section>

        <section className="portfolio-section reveal">
          <h2 className="portfolio-section-title">College Projects</h2>
          <div className="portfolio-grid">
            {COLLEGE_PROJECTS.map((p) => (
              <ProjectCard
                key={p.id}
                img={p.img}
                title={p.title}
                desc={p.desc}
                onViewImage={setLightboxSrc}
              />
            ))}
          </div>
        </section>
      </main>

      <div className="bg-watermark" aria-hidden="true">Portfolio</div>
      <Lightbox src={lightboxSrc} open={!!lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  )
}
