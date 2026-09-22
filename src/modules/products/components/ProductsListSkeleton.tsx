import { Skeleton } from '@/components/ui/skeleton'

export function ProductsListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(14rem,1fr)_9rem_7rem_7rem_7rem_7rem_6rem_6rem] gap-4 border-b border-border p-5">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(14rem,1fr)_9rem_7rem_7rem_7rem_7rem_6rem_6rem] items-center gap-4 border-b border-border p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-14 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }, (_, fact) => (
                <div key={fact} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="size-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
