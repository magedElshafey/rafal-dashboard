import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryDetailsHeader } from '@/modules/categories/components/CategoryDetailsHeader'
import { CategoryImage } from '@/modules/categories/components/CategoryImage'
import type { Category } from '@/modules/categories/types/category.types'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <DashboardCard padding="lg" className="h-full min-w-0 space-y-5">
        <h2 id={headingId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {children}
      </DashboardCard>
    </section>
  )
}

/** Undefined data uses placeholders inside the same section, card, grid and metadata geometry. */
export function CategoryDetailsLayout({ category }: { category?: Category }) {
  const { t, i18n } = useTranslation()
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const locale = resolveAppLocale(i18n.language)
  const name = category?.name[language].trim() || t('categories.details.title')
  const number = (value: number | undefined) =>
    value === undefined ? '—' : new Intl.NumberFormat(locale).format(value)
  const date = (value: string | undefined) => formatDateTime(value, { locale }) || '—'
  const placeholder = <Skeleton className="h-5 w-32 max-w-full" />
  const parentId = category?.parent_id

  return (
    <>
      <CategoryDetailsHeader category={category} loading={!category} />
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Section title={t('categories.details.overview')}>
            <dl className="grid gap-5 sm:grid-cols-2">
              <ResponsiveDataFact label={t('categories.details.id')}>
                {category ? <bdi>{category.id}</bdi> : placeholder}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.details.slug')}>
                {category ? <bdi className="[overflow-wrap:anywhere]">{category.slug.trim() || '—'}</bdi> : placeholder}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.fields.nameAr')}>
                {category ? (
                  <bdi className="[overflow-wrap:anywhere]">{category.name.ar.trim() || '—'}</bdi>
                ) : (
                  placeholder
                )}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.fields.nameEn')}>
                {category ? (
                  <bdi className="[overflow-wrap:anywhere]">{category.name.en.trim() || '—'}</bdi>
                ) : (
                  placeholder
                )}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.fields.sortOrder')}>
                {category ? number(category.sort_order) : placeholder}
              </ResponsiveDataFact>
            </dl>
          </Section>
          <Section title={t('categories.fields.image')}>
            <div className="mx-auto aspect-square w-full max-w-64">
              {category ? (
                <CategoryImage url={category.image_url} alt={name} className="size-full object-contain" />
              ) : (
                <Skeleton className="size-full" />
              )}
            </div>
          </Section>
        </div>
        <Section title={t('categories.details.description')}>
          <div className="min-h-20 max-w-prose whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
            {category ? (
              <p dir="auto">{category.description?.[language].trim() || '—'}</p>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </div>
        </Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title={t('categories.details.hierarchy')}>
            <dl className="grid gap-5 sm:grid-cols-2">
              <ResponsiveDataFact label={t('categories.fields.parent')}>
                {!category ? (
                  placeholder
                ) : parentId === null ? (
                  t('categories.hierarchy.root')
                ) : Number.isSafeInteger(parentId) && parentId !== undefined && parentId > 0 ? (
                  <Link
                    className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    to={Routes.categoryDetailPath(parentId)}
                  >
                    <bdi>{t('categories.parent.idFallback', { id: parentId })}</bdi>
                  </Link>
                ) : (
                  '—'
                )}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.fields.children')}>
                {category ? number(category.children_count) : placeholder}
              </ResponsiveDataFact>
            </dl>
          </Section>
          <Section title={t('categories.details.metadata')}>
            <dl className="grid gap-5 sm:grid-cols-2">
              <ResponsiveDataFact label={t('categories.details.createdAt')}>
                {category ? date(category.created_at) : placeholder}
              </ResponsiveDataFact>
              <ResponsiveDataFact label={t('categories.details.updatedAt')}>
                {category ? date(category.updated_at) : placeholder}
              </ResponsiveDataFact>
            </dl>
          </Section>
        </div>
      </div>
    </>
  )
}
