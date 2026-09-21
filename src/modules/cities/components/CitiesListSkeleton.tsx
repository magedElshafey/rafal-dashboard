import { Skeleton } from '@/components/ui/skeleton'

export function CitiesListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1fr_10rem_7rem_7rem_5rem] gap-4 border-b border-border p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_10rem_7rem_7rem_5rem] items-center gap-4 border-b border-border p-5"
          >
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="size-9" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="size-9" />
            </div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
