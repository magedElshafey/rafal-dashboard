import { Skeleton } from '@/components/ui/skeleton'

export function CategoriesListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-[6rem_1.2fr_1fr_6rem_0.7fr_6rem_5rem] gap-4 border-b border-border p-5">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[6rem_1.2fr_1fr_6rem_0.7fr_6rem_5rem] items-center gap-4 border-b border-border p-5"
          >
            <Skeleton className="size-14 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="size-9" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="size-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, fact) => (
                <Skeleton key={fact} className="h-10" />
              ))}
            </div>
            <Skeleton className="size-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
