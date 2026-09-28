import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'

export function AboutUsFormSkeleton() {
  return (
    <div data-testid="about-us-form-skeleton" aria-hidden="true" className="space-y-5">
      {Array.from({ length: 5 }, (_, section) => (
        <DashboardCard key={section} className="space-y-5" padding="lg">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
          {section === 0 || section === 4 ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}
        </DashboardCard>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-36" />
      </div>
    </div>
  )
}
