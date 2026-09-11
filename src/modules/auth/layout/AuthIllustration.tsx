import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import authIllustration from '@/assets/Illustration.png'

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
      <img
        src={authIllustration}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="
          block
          h-auto
          max-h-85
          w-full
          max-w-105
          object-contain
          sm:max-h-105
          sm:max-w-125
          md:max-h-125
          md:max-w-140
          lg:max-h-[calc(100dvh-32px)]
          lg:max-w-154.5
        "
      />
    </aside>
  )
})
