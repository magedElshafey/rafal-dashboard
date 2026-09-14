import { Skeleton } from '@/components/ui/skeleton'

export function CategoryFormSkeleton() {
  return (
    <div role="status" className="space-y-7" aria-busy="true">
      <span className="sr-only">Loading</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
