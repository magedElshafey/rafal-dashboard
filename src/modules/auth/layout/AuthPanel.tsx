import { memo, type PropsWithChildren, type ReactNode } from 'react'

import { AuthBackButton } from '@/modules/auth/layout/AuthBackButton'

type AuthPanelProps = PropsWithChildren<{
  title: string
  description: string
  showBackButton?: boolean
  onBack?: () => void
  footer?: ReactNode
}>

export const AuthPanel = memo(function AuthPanel({
  title,
  description,
  showBackButton = false,
  onBack,
  footer,
  children,
}: AuthPanelProps) {
  return (
    <div
      className="
        w-full
        px-5 pb-3 pt-6
        sm:px-8 sm:pb-4 sm:pt-8
        md:px-12
        lg:px-8 lg:py-10
        xl:px-10
      "
    >
      <div className="mx-auto flex w-full max-w-154 flex-col">
        {showBackButton && (
          <div className="mb-5 sm:mb-6">
            <AuthBackButton onClick={onBack} />
          </div>
        )}

        <header className="mb-5 md:mb-6">
          <h1 className="text-2xl font-semibold leading-tight text-neutral-900">{title}</h1>

          <p className="mt-2 max-w-2xl font-normal leading-7 text-neutral-700 md:leading-8">{description}</p>
        </header>

        <div className="w-full">{children}</div>

        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  )
})
