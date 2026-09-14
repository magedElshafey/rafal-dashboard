import { memo } from 'react'

import { useTranslation } from 'react-i18next'

import rafalAuthImage from '@/assets/auth.png'

export const AuthIllustration = memo(function AuthIllustration() {
  const { t } = useTranslation()

  return (
    <aside
      aria-label={t('auth.common.illustration_label')}
      className="
        min-w-0
        bg-page
        px-5
        pb-6
        pt-1

        sm:px-8
        sm:pb-8

        md:px-12

        lg:h-dvh
        lg:min-h-0
        lg:p-4
        lg:ps-0
      "
    >
      <div
        className="
          relative
          min-h-72
          w-full
          overflow-hidden
          rounded-3xl

          sm:min-h-96

          lg:h-full
          lg:min-h-0
        "
      >
        <img
          src={rafalAuthImage}
          alt=""

          sizes="
            (max-width: 1023px) 100vw,
            (max-width: 1440px) 42vw,
            618px
          "
          className="
            object-cover
            object-[center_58%]

            sm:object-[center_55%]
            lg:object-center
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            bg-linear-to-t
            from-black/15
            via-transparent
            to-black/5
          "
        />
      </div>
    </aside>
  )
})
