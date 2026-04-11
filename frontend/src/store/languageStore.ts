import { create } from 'zustand'
import i18n from '../lib/i18n'

type Language = 'ar' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

const savedLang = (localStorage.getItem('nuzul-lang') as Language) || 'ar'

// Initialize HTML attributes on load
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = savedLang

export const useLanguageStore = create<LanguageState>((set) => ({
  language: savedLang,
  setLanguage: (language) => {
    localStorage.setItem('nuzul-lang', language)
    i18n.changeLanguage(language)
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    set({ language })
  },
}))
