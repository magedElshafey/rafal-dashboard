import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function DashboardLanguageToggle() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage === 'ar' || i18n.language === 'ar'
  const nextLanguage = isArabic ? 'en' : 'ar'

  return (
    <Button
      type="button"
      variant="ghost"
      className="px-2 sm:px-3"
      aria-label={t(isArabic ? 'dashboard.topbar.useEnglish' : 'dashboard.topbar.useArabic')}
      onClick={() => void i18n.changeLanguage(nextLanguage)}
    >
      <Languages className="size-5" aria-hidden />
      <span className="hidden text-xs font-semibold sm:inline">{isArabic ? 'EN' : 'ع'}</span>
    </Button>
  )
}
