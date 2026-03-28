'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'vi' | 'en'

interface LanguageStore {
  currentLanguage: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      currentLanguage: 'vi',
      setLanguage: (language: Language) => {
        set({ currentLanguage: language })
      }
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({ currentLanguage: state.currentLanguage }),
    }
  )
)
