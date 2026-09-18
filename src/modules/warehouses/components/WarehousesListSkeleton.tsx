import { Skeleton } from '@/components/ui/skeleton'

export function WarehousesListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1.5fr_8rem_5rem] gap-4 border-b border-border p-5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.5fr_8rem_5rem] items-center gap-4 border-b border-border p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="size-9" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="size-9" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-7 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
