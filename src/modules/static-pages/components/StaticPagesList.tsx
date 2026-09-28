import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { StaticPageActions } from '@/modules/static-pages/components/StaticPageActions'
import type { StaticPage } from '@/modules/static-pages/types/static-page.types'
import { getLocalizedStaticPageTitle } from '@/modules/static-pages/utils/static-page.utils'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  pages: readonly StaticPage[]
  onEdit: (page: StaticPage) => void
}

export function StaticPagesList({ pages, onEdit }: Props) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const columns = [
    { id: 'title', header: t('staticPages.fields.title') },
    { id: 'slug', header: t('staticPages.fields.slug') },
    { id: 'published', header: t('staticPages.fields.publishedState'), className: 'w-28' },
    { id: 'system', header: t('staticPages.fields.systemState'), className: 'w-28' },
    { id: 'updated', header: t('staticPages.fields.updatedAt'), className: 'w-40' },
    { id: 'actions', header: t('staticPages.actions.label'), className: 'w-20' },
  ]
  const title = (page: StaticPage) =>
    getLocalizedStaticPageTitle(page, i18n.language, t('staticPages.titleFallback', { id: page.id }))
  const published = (page: StaticPage) => (
    <Badge variant={page.isPublished ? 'success' : 'outline'}>
      {t(page.isPublished ? 'staticPages.status.published' : 'staticPages.status.unpublished')}
    </Badge>
  )
  const system = (page: StaticPage) => (
    <Badge variant={page.isSystem ? 'secondary' : 'outline'}>
      {t(page.isSystem ? 'staticPages.status.system' : 'staticPages.status.standard')}
    </Badge>
  )
  const updatedAt = (page: StaticPage) => formatDateTime(page.updatedAt, { locale }) || '—'

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {pages.map((page) => {
            const displayTitle = title(page)
            return (
              <ResponsiveDataTableRow key={page.id}>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium">
                  <bdi dir="auto">{displayTitle}</bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <code className="break-all text-xs">{page.slug}</code>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{published(page)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{system(page)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{updatedAt(page)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <StaticPageActions page={page} title={displayTitle} onEdit={onEdit} />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {pages.map((page) => {
          const displayTitle = title(page)
          return (
            <ResponsiveDataMobileCard
              key={page.id}
              title={<bdi dir="auto">{displayTitle}</bdi>}
              subtitle={page.slug}
              actions={<StaticPageActions page={page} title={displayTitle} onEdit={onEdit} />}
              facts={
                <>
                  <ResponsiveDataFact label={t('staticPages.fields.publishedState')}>
                    {published(page)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('staticPages.fields.systemState')}>{system(page)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('staticPages.fields.updatedAt')}>{updatedAt(page)}</ResponsiveDataFact>
                </>
              }
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
