'use client'

import { useLanguageStore } from '@/store/languageStore'
import { translations, TranslationKey } from '@/translations'

export const useTranslation = () => {
  const { currentLanguage } = useLanguageStore()
  
  const t = (key: TranslationKey): string => {
    const currentTranslations = translations[currentLanguage] as typeof translations.vi;
    return currentTranslations[key] || translations.vi[key] || key;
  }
  
  return { t, currentLanguage }
}
