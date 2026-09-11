import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import env from '@/config/env'

export type AppLanguage = 'en' | 'ar'

export function normalizeAppLanguage(language?: string): AppLanguage {
  return language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function useAppLanguage() {
  const { i18n } = useTranslation()
  const queryClient = useQueryClient()
  const language = normalizeAppLanguage(i18n.resolvedLanguage ?? i18n.language)

  const changeLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      if (nextLanguage === normalizeAppLanguage(i18n.resolvedLanguage ?? i18n.language)) return

      await i18n.changeLanguage(nextLanguage)
      localStorage.setItem(env.LOCALE_KEY, nextLanguage)
      document.documentElement.lang = nextLanguage
      document.documentElement.dir = i18n.dir(nextLanguage)

      await queryClient.invalidateQueries({ type: 'active', refetchType: 'active' })
    },
    [i18n, queryClient]
  )

  return { language, changeLanguage }
}
