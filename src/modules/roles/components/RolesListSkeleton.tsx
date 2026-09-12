import { Skeleton } from '@/components/ui/skeleton'

export function RolesListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_2fr_5rem] gap-4 border-b border-border-subtle p-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid grid-cols-[1fr_2fr_5rem] items-center gap-4 border-b border-border p-5">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="size-9" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="size-9" />
            </div>
            <Skeleton className="mt-5 h-4 w-24" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
