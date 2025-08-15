import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const DEFAULT_SETTINGS = {
  currency: 'EUR',
  decimal: 'comma', // 'comma' (es-ES) or 'dot' (en-US)
  language: 'es', // BCP-47 code like 'es', 'en', 'fr', 'pt-BR'
  theme: 'light', // 'light', 'dark', 'auto'
}

export function useUserSettings(user) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'settings', 'preferences')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() })
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    })
    return () => unsub()
  }, [user?.uid])

  // Aplicar tema al HTML
  useEffect(() => {
    const html = document.documentElement
    const isDark = settings.theme === 'dark' || 
      (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    if (isDark) {
      html.classList.add('dark')
      // Cambiar meta theme-color para dark mode
      const metaTheme = document.querySelector('meta[name="theme-color"]')
      if (metaTheme) metaTheme.content = '#111827'
    } else {
      html.classList.remove('dark')
      // Cambiar meta theme-color para light mode
      const metaTheme = document.querySelector('meta[name="theme-color"]')
      if (metaTheme) metaTheme.content = '#4f46e5'
    }
  }, [settings.theme])

  const locale = useMemo(() => {
    if (settings?.language) return settings.language
    return settings.decimal === 'dot' ? 'en-US' : 'es-ES'
  }, [settings.language, settings.decimal])

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0)
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: settings.currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safe)
    } catch {
      return `${safe.toFixed(2)} ${settings.currency || 'EUR'}`
    }
  }

  const formatNumber = (num) => {
    const safe = Number(num || 0)
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe)
  }

  const currencySymbol = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: settings.currency || 'EUR' })
        .formatToParts(0)
      const sym = parts.find(p => p.type === 'currency')?.value
      return sym || '€'
    } catch {
      return '€'
    }
  }, [settings.currency, locale])

  const saveSettings = async (partial) => {
    if (!user) return
    const next = { ...settings, ...partial }
    setSettings(next)
    await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), next, { merge: true })
  }

  return { settings, saveSettings, formatCurrency, formatNumber, currencySymbol, locale }
}


