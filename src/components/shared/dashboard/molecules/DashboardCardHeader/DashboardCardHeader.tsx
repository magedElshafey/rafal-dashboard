import type { ReactNode } from 'react'

import { DashboardIcon, type SvgIconComponent } from '@/components/shared/dashboard/atoms/DashboardIcon'
import { cn } from '@/lib/utils'

export type DashboardCardHeaderProps = {
  icon?: SvgIconComponent
  title: ReactNode
  titleId?: string
  description?: ReactNode
  descriptionAs?: 'p' | 'div'
  className?: string
  contentClassName?: string
  iconContainerClassName?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  media?: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3'
}

export function DashboardCardHeader({
  icon,
  title,
  titleId,
  description,
  descriptionAs: Description = 'p',
  className,
  contentClassName,
  iconContainerClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
  media,
  titleAs: Title = 'h2',
}: DashboardCardHeaderProps) {
  const hasIcon = Boolean(icon)
  const hasMedia = Boolean(media)
  const hasAttachment = hasIcon || hasMedia
  return (
    <div className={cn('min-w-0 flex-col md:flex-row', hasAttachment && 'flex items-start gap-3', className)}>
      {hasIcon && <DashboardIcon icon={icon} className={iconContainerClassName} iconClassName={iconClassName} />}
      {hasMedia && media}
      <div className={cn('min-w-0 flex-1', contentClassName)}>
        <Title id={titleId} className={cn('wrap-break-word text-2xl font-semibold text-content-heavy', titleClassName)}>
          {title}
        </Title>

        {description && (
          <Description className={cn('mt-1 wrap-break-word text-xs text-content-secondary', descriptionClassName)}>
            {description}
          </Description>
        )}
      </div>
    </div>
  )
}
