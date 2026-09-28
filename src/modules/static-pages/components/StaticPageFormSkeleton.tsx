import { Skeleton } from '@/components/ui/skeleton'

export function StaticPageFormSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5" data-testid="static-page-form-skeleton">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-5 rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className={index === 0 ? 'h-10 w-64' : 'h-48 w-full'} />
        </div>
      ))}
    </div>
  )
}
