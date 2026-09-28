import { Skeleton } from '@/components/ui/skeleton'

export function CustomerOrdersListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-3 p-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, cell) => (
            <Skeleton key={cell} className="h-5 w-full max-w-28" />
          ))}
        </div>
      ))}
    </div>
  )
}
