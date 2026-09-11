import { memo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type AuthBackButtonProps = {
  onClick?: () => void
  className?: string
}

export const AuthBackButton = memo(function AuthBackButton({ onClick, className }: AuthBackButtonProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  function handleClick() {
    if (onClick) {
      onClick()
      return
    }

    navigate(-1)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={cn(
        'h-12 rounded-lg border border-border-default bg-transparent px-6 text-base font-normal text-content-secondary',
        'hover:bg-surface-card hover:text-content-primary',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 shadow-none',
        className
      )}
      aria-label={t('auth.common.go_back')}
    >
      <ArrowLeft className="size-4" aria-hidden />
      <span>{t('auth.common.back')}</span>
    </Button>
  )
})
