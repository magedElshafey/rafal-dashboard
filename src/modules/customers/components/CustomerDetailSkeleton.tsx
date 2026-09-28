import { Skeleton } from '@/components/ui/skeleton'

export function CustomerDetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
      {Array.from({ length: 3 }, (_, card) => (
        <div key={card} className="space-y-5 rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
