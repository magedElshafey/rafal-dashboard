import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import {
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { BlogCategory } from '@/modules/blogs/types/blog-category.types'
type Props = {
  items?: BlogCategory[]
  loading?: boolean
  onDelete?: (item: BlogCategory) => void
  onEdit?: (item: BlogCategory) => void
  disabled?: boolean
}
export function BlogCategoriesList({ items = [], loading = false, onDelete, onEdit, disabled }: Props) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const rows = loading ? Array.from({ length: 5 }, () => null) : items
  const columns = ['name', 'slug', 'created_at', 'updated_at', 'actions'].map((id) => ({
    id,
    header: t(`blogCategories.fields.${id}`),
  }))
  const name = (item: BlogCategory) =>
    item.name[locale] || item.name.ar || item.name.en || t('blogCategories.unavailable')
  const action = (item: BlogCategory) => (
    <div className="flex shrink-0">
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={t('blogCategories.editNamed', { name: name(item) })}
        onClick={() => onEdit?.(item)}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={t('blogCategories.deleteNamed', { name: name(item) })}
        onClick={() => onDelete?.(item)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
  const date = (value: string) => (
    <time dateTime={value} dir="auto">
      {formatDateTime(value, { locale })}
    </time>
  )
  return (
    <div aria-hidden={loading || undefined}>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {rows.map((item, index) => (
            <ResponsiveDataTableRow key={item?.id ?? index}>
              <ResponsiveDataTableCell className="max-w-64 whitespace-normal break-words">
                {item ? <bdi>{name(item)}</bdi> : <Skeleton className="h-5 w-36" />}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-48 whitespace-normal break-all">
                {item ? <bdi>{item.slug || t('blogCategories.unavailable')}</bdi> : <Skeleton className="h-5 w-24" />}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                {item ? date(item.createdAt) : <Skeleton className="h-5 w-32" />}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                {item ? date(item.updatedAt) : <Skeleton className="h-5 w-32" />}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>
                {item ? action(item) : <Skeleton className="h-9 w-18" />}
              </ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {rows.map((item, index) => {
          if (!item)
            return (
              <article key={index} className="rounded-xl border border-border bg-surface p-4">
                <header className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-9 w-18" />
                </header>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 2 }, (_, fact) => (
                    <div key={fact} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </article>
            )
          return (
            <ResponsiveDataMobileCard
              key={item?.id ?? index}
              title={item ? <bdi>{name(item)}</bdi> : <Skeleton className="h-5 w-36" />}
              subtitle={
                item ? <bdi>{item.slug || t('blogCategories.unavailable')}</bdi> : <Skeleton className="h-4 w-24" />
              }
              actions={item ? action(item) : <Skeleton className="h-9 w-18" />}
              facts={
                <>
                  <ResponsiveDataFact label={t('blogCategories.fields.created_at')}>
                    {item ? date(item.createdAt) : <Skeleton className="h-5 w-32" />}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('blogCategories.fields.updated_at')}>
                    {item ? date(item.updatedAt) : <Skeleton className="h-5 w-32" />}
                  </ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </div>
  )
}
