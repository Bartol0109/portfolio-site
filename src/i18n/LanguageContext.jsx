import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const KEY = 'visora-lang'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'hr' || saved === 'en') return saved
    } catch {
      /* ignore */
    }
    return 'en'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const value = useMemo(() => ({
    lang,
    t: translations[lang],
    toggle: () => setLang((cur) => (cur === 'en' ? 'hr' : 'en')),
  }), [lang])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage needs LanguageProvider')
  return ctx
}
