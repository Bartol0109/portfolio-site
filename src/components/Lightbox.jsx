import { useEffect } from 'react'

export default function Lightbox({ src, open, onClose }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="lightbox lightbox--open"
      aria-hidden="false"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button type="button" className="lightbox-close" aria-label="Close" onClick={onClose}>
        &times;
      </button>
      <div className="lightbox-backdrop" onClick={onClose} />
      <div className="lightbox-content">
        <img src={src} alt="" className="lightbox-img" />
      </div>
    </div>
  )
}
