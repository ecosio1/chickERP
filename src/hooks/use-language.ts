"use client"

import { useState, useEffect, useCallback } from "react"
import { Language, t as translate, TranslationKey, formatAge as formatAgeUtil } from "@/lib/translations"

const LANGUAGE_KEY = "chickerp_language"

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get saved language from localStorage
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language
    if (saved && (saved === "en" || saved === "tl")) {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translate(key, language),
    [language]
  )

  const formatAge = useCallback(
    (days: number) => formatAgeUtil(days, language),
    [language]
  )

  return {
    language,
    setLanguage,
    t,
    formatAge,
    mounted,
  }
}
