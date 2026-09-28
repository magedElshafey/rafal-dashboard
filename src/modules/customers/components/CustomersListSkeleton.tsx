import { Skeleton } from '@/components/ui/skeleton'

export function CustomersListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_9rem_6rem_8rem_5rem] gap-4 border-b border-border p-5">
            {Array.from({ length: 6 }, (_, cell) => (
              <Skeleton key={cell} className="h-5 w-full max-w-32" />
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="size-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, fact) => (
                <Skeleton key={fact} className="h-12" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
