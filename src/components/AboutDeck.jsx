import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const NODE_PHOTOS = {
  who: { src: '/slike/about/who.jpg', pos: 'center 28%' },
  work: { src: '/slike/about/work.jpg', pos: 'center 78%' },
  path: { src: '/slike/about/path.jpg', pos: 'center 42%' },
  off: { src: '/slike/about/off.jpg', pos: 'center 55%' },
  stack: { src: '/slike/about/stack.jpg', pos: 'center center' },
}

export default function AboutDeck() {
  const { t } = useLanguage()
  const cards = t.about.cards
  const [active, setActive] = useState(0)
  const [missing, setMissing] = useState({})
  const panelRef = useRef(null)
  const skipScroll = useRef(true)
  const card = cards[active]
  const photo = NODE_PHOTOS[card.id]
  const n = cards.length

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false
      return
    }
    const el = panelRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (rect.top < 88 || rect.bottom > window.innerHeight - 16) {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
    }
  }, [active])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowRight') setActive((i) => Math.min(n - 1, i + 1))
      if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n])

  return (
    <div className="about-deck">
      <p className="about-deck-hint">{t.about.hint}</p>

      <nav
        className="about-timeline"
        style={{ '--n': n, '--i': active }}
        aria-label={t.about.title}
      >
        <div className="about-timeline-track" aria-hidden="true">
          <div className="about-timeline-fill" />
        </div>
        {cards.map((c, i) => {
          const shot = NODE_PHOTOS[c.id]
          const gone = missing[c.id]
          return (
            <button
              key={c.id}
              type="button"
              className={`about-node${i === active ? ' is-active' : ''}${i < active ? ' is-past' : ''}`}
              onClick={() => setActive(i)}
              aria-current={i === active ? 'step' : undefined}
              aria-controls="about-panel"
            >
              <span className="about-node-orb">
                {shot && !gone ? (
                  <img
                    src={shot.src}
                    alt=""
                    style={{ objectPosition: shot.pos }}
                    onError={() => setMissing((m) => ({ ...m, [c.id]: true }))}
                  />
                ) : (
                  <span className="about-node-empty">{c.kicker}</span>
                )}
              </span>
              <span className="about-node-kicker">{c.kicker}</span>
              <span className="about-node-mark">{c.mark}</span>
            </button>
          )
        })}
      </nav>

      <article className="about-panel" id="about-panel" key={card.id} ref={panelRef} aria-live="polite">
        <div className="about-panel-photo">
          {photo && !missing[card.id] ? (
            <img
              className="about-panel-img"
              src={photo.src}
              alt=""
              style={{ objectPosition: photo.pos }}
              onError={() => setMissing((m) => ({ ...m, [card.id]: true }))}
            />
          ) : (
            <div className="about-panel-empty">
              <span>{card.kicker}</span>
              <p>{t.about.photoSoon}</p>
            </div>
          )}
        </div>
        <div className="about-panel-copy">
          <p className="about-card-kicker">{card.kicker}</p>
          <h3 className="about-panel-title">{card.title}</h3>
          {card.body ? <p className="about-panel-body">{card.body}</p> : null}
          {card.tags ? (
            <div className="about-card-tags">
              {card.tags.map((tag) => (
                <span key={tag} className="about-tag">{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}
