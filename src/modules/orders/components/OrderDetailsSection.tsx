import { useId, type ReactNode } from 'react'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { Skeleton } from '@/components/ui/skeleton'

export function OrderDetailsSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="min-w-0">
      <DashboardCard padding="lg" className="h-full min-w-0 space-y-5">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {children}
      </DashboardCard>
    </section>
  )
}

export function OrderDetailsFacts({ facts, loading = false }: { facts: [string, ReactNode][]; loading?: boolean }) {
  return (
    <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <ResponsiveDataFact key={label} label={label} className="[overflow-wrap:anywhere]">
          {loading ? <Skeleton className="h-5 w-32 max-w-full" /> : <bdi>{value ?? '—'}</bdi>}
        </ResponsiveDataFact>
      ))}
    </dl>
  )
}
