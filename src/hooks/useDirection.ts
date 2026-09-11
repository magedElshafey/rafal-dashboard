import { useTranslation } from 'react-i18next'

export type AppDirection = 'ltr' | 'rtl'

export function useDirection(): AppDirection {
  const { i18n } = useTranslation()
  return i18n.dir() as AppDirection
}
