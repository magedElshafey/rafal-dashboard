import { Skeleton } from '@/components/ui/skeleton'

export function AdminsListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1.4fr_1.4fr_5rem] gap-4 border-b border-border p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1.4fr_1.4fr_5rem] items-center gap-4 border-b border-border p-5"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="size-9" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border p-4">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="size-9" />
            </div>
            <Skeleton className="mt-5 h-4 w-20" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
