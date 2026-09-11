import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

export type DashboardPageHeaderProps = Omit<ComponentProps<'header'>, 'title'> & {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  titleId?: string
  intro?: ReactNode
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  titleId,
  intro,
  className,
  ...props
}: DashboardPageHeaderProps) {
  return (
    <header {...props} className={cn('mb-6 flex flex-col items-start gap-4 md:flex-row md:justify-between', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {intro ? <p className="text-sm text-muted-foreground">{intro}</p> : null}
        <h1 id={titleId} className="text-3xl font-semibold text-foreground">
          {title}
        </h1>
        {description ? <p className="text-start text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}
