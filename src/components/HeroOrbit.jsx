import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const ORB_COUNT = 7
const ORBIT_R = 148
const ORBIT_DUR = 24

const SATS = [
  { r: 136, delay: '-2s', dur: '11s' },
  { r: 136, delay: '-7.5s', dur: '11s' },
  { r: 164, delay: '-1s', dur: '16s' },
  { r: 164, delay: '-9s', dur: '16s' },
  { r: 90, delay: '-3s', dur: '7s' },
]

const SPRING = 0.075
const DAMP = 0.86
const THROW = 1.15

function homePos(index, nowMs, scale) {
  const spin = (nowMs / (ORBIT_DUR * 1000)) * Math.PI * 2
  const slot = (index / ORB_COUNT) * Math.PI * 2
  const ang = spin + slot
  const r = ORBIT_R * scale
  return { x: Math.cos(ang) * r, y: Math.sin(ang) * r }
}

export default function HeroOrbit() {
  const { t } = useLanguage()
  const labels = t.orbit.skills
  const stageRef = useRef(null)
  const tiltRef = useRef(null)
  const orbEls = useRef([])
  const physics = useRef(
    Array.from({ length: ORB_COUNT }, () => ({ x: 0, y: 0, vx: 0, vy: 0, dragging: false, init: false }))
  )
  const drag = useRef(null)
  const [active, setActive] = useState(null)
  const [boom, setBoom] = useState(0)
  const [held, setHeld] = useState(null)

  const ping = (index) => {
    setActive(index)
    setBoom((n) => n + 1)
  }

  useEffect(() => {
    let raf = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const centerOf = () => {
      const el = tiltRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        scale: rect.width / 380,
      }
    }

    const localFromEvent = (e) => {
      const c = centerOf()
      if (!c) return { x: 0, y: 0 }
      return { x: e.clientX - c.x, y: e.clientY - c.y }
    }

    const onMove = (e) => {
      const d = drag.current
      if (!d) return
      const p = physics.current[d.index]
      const loc = localFromEvent(e)
      const nx = loc.x - d.offX
      const ny = loc.y - d.offY
      p.vx = (nx - p.x) * THROW
      p.vy = (ny - p.y) * THROW
      p.x = nx
      p.y = ny
      d.moved += Math.hypot(e.movementX || 0, e.movementY || 0)
    }

    const onUp = (e) => {
      const d = drag.current
      if (!d) return
      const p = physics.current[d.index]
      p.dragging = false
      if (d.moved < 8) ping(d.index)
      drag.current = null
      setHeld(null)
      try {
        d.el.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }

    const tick = (now) => {
      const c = centerOf()
      const scale = c ? c.scale : 1
      physics.current.forEach((p, i) => {
        const el = orbEls.current[i]
        if (!el) return
        const home = homePos(i, reduce ? 0 : now, scale)
        if (!p.init) {
          p.x = home.x
          p.y = home.y
          p.init = true
        }
        if (!p.dragging) {
          p.vx += (home.x - p.x) * SPRING
          p.vy += (home.y - p.y) * SPRING
          p.vx *= DAMP
          p.vy *= DAMP
          p.x += p.vx
          p.y += p.vy
        }
        el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`
      })
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onGrab = (index) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const p = physics.current[index]
    const loc = (() => {
      const el = tiltRef.current
      if (!el) return { x: p.x, y: p.y }
      const rect = el.getBoundingClientRect()
      return {
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      }
    })()
    p.dragging = true
    p.vx = 0
    p.vy = 0
    drag.current = {
      index,
      offX: loc.x - p.x,
      offY: loc.y - p.y,
      moved: 0,
      el: e.currentTarget,
    }
    setHeld(index)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onStageMove = (e) => {
    if (drag.current) return
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    el.style.setProperty('--px', x.toFixed(3))
    el.style.setProperty('--py', y.toFixed(3))
    el.style.setProperty('--mx', `${((x + 1) / 2) * 100}%`)
    el.style.setProperty('--my', `${((y + 1) / 2) * 100}%`)
  }

  const onStageLeave = () => {
    if (drag.current) return
    const el = stageRef.current
    if (!el) return
    el.style.setProperty('--px', '0')
    el.style.setProperty('--py', '0')
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }

  return (
    <div
      className="hero-orbit"
      ref={stageRef}
      onMouseMove={onStageMove}
      onMouseLeave={onStageLeave}
    >
      <div className="hero-orbit-tilt" ref={tiltRef}>
        <div className="hero-orbit-spot hero-orbit-glow" />
        <div className="hero-orbit-ticks hero-orbit-glow" />
        <div className="hero-orbit-sweep hero-orbit-glow" />
        <div className="hero-orbit-ring hero-orbit-ring--slow" />
        <div className="hero-orbit-ring hero-orbit-ring--mid" />
        <div className="hero-orbit-ring hero-orbit-ring--core" />
        <div key={boom} className="hero-orbit-shock" />
        {SATS.map((sat, i) => (
          <span
            key={i}
            className="hero-orbit-sat"
            style={{ '--r': `${sat.r}px`, '--dur': sat.dur, '--delay': sat.delay }}
          />
        ))}
        <Link to="/#about" className="hero-orbit-core" aria-label={t.orbit.about}>
          <img src="/slike/Profilna.jpg" alt="" className="hero-orbit-core-img" />
        </Link>
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            ref={(node) => { orbEls.current[i] = node }}
            className={`hero-orb${label.length > 12 ? ' hero-orb--long' : ''}${active === i ? ' is-hot' : ''}${held === i ? ' is-drag' : ''}`}
            onPointerDown={onGrab(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="hero-orbit-hint">{t.orbit.hint}</p>
    </div>
  )
}
