import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'

export function AdminFormSkeleton() {
  const { t } = useTranslation()

  return (
    <div role="status" className="space-y-7" aria-busy="true">
      <span className="sr-only">{t('admins.loadingForm')}</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-full" />
        </div>
      ))}
    </div>
  )
}
