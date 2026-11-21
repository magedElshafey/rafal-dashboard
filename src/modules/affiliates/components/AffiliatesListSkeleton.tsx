import { Skeleton } from '@/components/ui/skeleton'

export function AffiliatesListSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-4 border-b border-border p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid grid-cols-6 items-center gap-4 border-b border-border p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, factIndex) => (
                <Skeleton key={factIndex} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
