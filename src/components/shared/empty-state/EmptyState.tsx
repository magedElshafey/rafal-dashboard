import { useId, type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = Omit<ComponentProps<'section'>, 'title'> & {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  variant?: 'full' | 'compact'
}

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  variant = 'full',
  className,
  ...props
}: EmptyStateProps) {
  const titleId = useId()
  const descriptionId = useId()
  const hasActions = primaryAction || secondaryAction

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-slot="empty-state"
      data-variant={variant}
      className={cn(
        'flex w-full flex-col items-center justify-center text-center',
        variant === 'full' ? 'min-h-64 gap-5 p-8' : 'gap-3 p-5',
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {icon}
        </div>
      ) : null}

      <div className="max-w-lg space-y-1.5">
        <h2 id={titleId} className="font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {hasActions ? (
        <div className="flex w-full flex-col-reverse justify-center gap-2 sm:w-auto sm:flex-row">
          {secondaryAction}
          {primaryAction}
        </div>
      ) : null}
    </section>
  )
}
