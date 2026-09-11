import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const AuthIllustration = memo(function AuthIllustration() {
  const { t } = useTranslation()

  return (
    <aside
      aria-label={t('auth.common.illustration_label')}
      className="
        flex
        min-h-0
        min-w-0
        items-start
        justify-center
        overflow-hidden
        bg-[#F8FAFC]
        px-5
        pb-6
        pt-1
        sm:px-8
        sm:pb-8
        md:px-12
        lg:h-full
        lg:items-center
        lg:justify-end
        lg:p-0
      "
    >
      <div className="flex min-h-72 w-full max-w-154.5 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-100 via-white to-primary-200 p-10 text-center shadow-sm lg:min-h-[calc(100dvh-32px)]">
        <p className="text-4xl font-semibold text-primary-800">{t('dashboard.brand')}</p>
      </div>
    </aside>
  )
})
