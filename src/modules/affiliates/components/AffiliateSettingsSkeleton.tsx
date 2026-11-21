import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'

export function AffiliateSettingsSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <DashboardCard key={index} padding="lg" className="space-y-5">
          <Skeleton className="h-6 w-52" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DashboardCard>
      ))}
    </div>
  )
}
