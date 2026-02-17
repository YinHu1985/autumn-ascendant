import en from '../locales/en.json'
import zh from '../locales/zh.json'

type LocaleData = Record<string, string>
type Language = 'en' | 'zh'

export class LocManager {
  private static instance: LocManager
  private currentLang: Language = 'en'
  private locales: Record<Language, LocaleData> = {
    en,
    zh
  }
  // Runtime overrides for editing
  private overrides: Record<Language, LocaleData> = {
    en: {},
    zh: {}
  }
  private listeners: (() => void)[] = []

  private constructor() {}

  static getInstance(): LocManager {
    if (!LocManager.instance) {
      LocManager.instance = new LocManager()
    }
    return LocManager.instance
  }

  setLanguage(lang: Language) {
    this.currentLang = lang
    this.notifyListeners()
  }

  getLanguage(): Language {
    return this.currentLang
  }

  t(key: string, params?: Record<string, string | number>): string {
    // Check overrides first, then static files
    const text = this.overrides[this.currentLang][key] || this.locales[this.currentLang][key] || key
    
    if (params) {
      return Object.entries(params).reduce((acc, [k, v]) => {
        return acc.replace(`{${k}}`, String(v))
      }, text)
    }
    
    return text
  }

  hasKey(key: string): boolean {
    return key in this.overrides[this.currentLang] || key in this.locales[this.currentLang]
  }

  // Override a key at runtime (for editors)
  setOverride(lang: Language, key: string, value: string) {
    this.overrides[lang][key] = value
    // Only notify if we are modifying the current language
    if (this.currentLang === lang) {
      this.notifyListeners()
    }
  }

  // Get the complete merged locale data for export
  getMergedLocale(lang: Language): LocaleData {
    return {
      ...this.locales[lang],
      ...this.overrides[lang]
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(l => l())
  }
}

export const t = (key: string, params?: Record<string, string | number>) => {
  return LocManager.getInstance().t(key, params)
}
