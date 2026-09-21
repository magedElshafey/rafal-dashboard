import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsFormSkeleton() {
  return (
    <div data-testid="settings-form-skeleton" aria-hidden="true" className="space-y-5">
      {[1, 2, 3, 4, 5].map((section, index) => (
        <DashboardCard key={section} className="space-y-5" padding="lg">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            {index > 0 && index < 4 ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            ) : null}
          </div>
        </DashboardCard>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-36" />
      </div>
    </div>
  )
}
