import { ArrowLeft, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/modules/categories/types/category.types'
import { Routes } from '@/routes/routes'

export function CategoryDetailsHeader({ category, loading = false }: { category?: Category; loading?: boolean }) {
  const { t, i18n } = useTranslation()
  const name = category?.name[i18n.language.startsWith('ar') ? 'ar' : 'en'].trim() || t('categories.details.title')

  return (
    <div className="relative">
      <DashboardPageHeader
        title={
          <bdi className={`block min-h-9 break-words [overflow-wrap:anywhere] ${loading ? 'invisible' : ''}`}>
            {name}
          </bdi>
        }
        description={
          category ? (
            <Badge variant={category.is_active ? 'success' : 'outline'}>
              {t(category.is_active ? 'categories.status.active' : 'categories.status.inactive')}
            </Badge>
          ) : loading ? (
            <span className="inline-block h-6" />
          ) : undefined
        }
        actions={
          loading ? (
            <>
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-24" />
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to={Routes.categories}>
                  <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
                  {t('categories.details.back')}
                </Link>
              </Button>
              {category ? (
                <Button asChild>
                  <Link
                    to={Routes.categoryEditPath(category.id)}
                    aria-label={t('categories.actions.editNamed', { name })}
                  >
                    <Pencil aria-hidden="true" />
                    {t('categories.actions.edit')}
                  </Link>
                </Button>
              ) : null}
            </>
          )
        }
      />
      {/* Keep the div-based Skeleton outside the heading and description's phrasing content. */}
      {loading ? (
        <>
          <Skeleton className="pointer-events-none absolute start-0 top-0 h-9 w-64 max-w-full" />
          <Skeleton className="pointer-events-none absolute start-0 top-10 h-6 w-20" />
        </>
      ) : null}
    </div>
  )
}
