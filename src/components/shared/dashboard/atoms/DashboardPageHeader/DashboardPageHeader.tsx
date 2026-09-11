import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export const DashboardPageHeader = ({
  title,
  description,
  renderSuffix,
  rootClassName,
  titleId,
  intro,
}: {
  title: string
  description?: string
  renderSuffix?: () => ReactNode
  rootClassName?: string
  titleId?: string
  intro?: string
}) => {
  return (
    <header
      className={cn(
        'flex justify-between gap-4 mb-6 flex-wrap flex-col md:flex-row items-center md:items-start',
        rootClassName
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{intro}</p>
        <h1 id={titleId} className="text-3xl font-semibold text-foreground">
          {title}
        </h1>
        {description && <p className="text-neutral-600 text-sm text-center md:text-start">{description}</p>}
      </div>
      {renderSuffix && renderSuffix()}
    </header>
  )
}
