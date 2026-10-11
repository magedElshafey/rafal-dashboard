import { useId, type ReactNode } from 'react'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'

/** Shared section geometry for the details content and its loading skeleton. */
export function ProductDetailsSection({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <DashboardCard padding="lg" className="h-full min-w-0 space-y-5">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {children}
      </DashboardCard>
    </section>
  )
}
