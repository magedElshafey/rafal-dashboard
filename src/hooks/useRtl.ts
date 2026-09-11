import { useTranslation } from 'react-i18next'

export const useRtl = () => {
  const { i18n } = useTranslation()

  return { isRtl: i18n.dir() === 'rtl' }
}
