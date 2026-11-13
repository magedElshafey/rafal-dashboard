import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'

export function LoyaltySettingsSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <DashboardCard key={index} padding="lg" className="space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </DashboardCard>
      ))}
    </div>
  )
}
