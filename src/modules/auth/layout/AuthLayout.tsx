import { memo, type PropsWithChildren, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AuthIllustration } from '@/modules/auth/layout/AuthIllustration'
import { AuthPanel } from '@/modules/auth/layout/AuthPanel'

type AuthLayoutProps = PropsWithChildren<{
  title: string
  description: string
  showBackButton?: boolean
  onBack?: () => void
  footer?: ReactNode
}>

export const AuthLayout = memo(function AuthLayout({
  title,
  description,
  showBackButton = false,
  onBack,
  footer,
  children,
}: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <main className="min-h-dvh overflow-x-hidden bg-page">
      <section
        aria-label={t('auth.common.page_label')}
        className="
          flex min-h-dvh flex-col
          lg:grid
          lg:h-dvh
          lg:min-h-0
          lg:grid-cols-[minmax(0,1fr)_minmax(360px,618px)]
          lg:overflow-hidden
        "
      >
        <div
          className="
            flex min-w-0
            lg:min-h-0
            lg:items-center
            lg:justify-center
            lg:overflow-y-auto
          "
        >
          <AuthPanel
            title={title}
            description={description}
            showBackButton={showBackButton}
            onBack={onBack}
            footer={footer}
          >
            {children}
          </AuthPanel>
        </div>

        <AuthIllustration />
      </section>
    </main>
  )
})
