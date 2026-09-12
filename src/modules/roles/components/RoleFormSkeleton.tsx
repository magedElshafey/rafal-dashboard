import { Skeleton } from '@/components/ui/skeleton'
import { useTranslation } from 'react-i18next'

export function RoleFormSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="space-y-7" aria-busy="true">
      <span className="sr-only">{t('roles.loadingForm')}</span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  )
}
