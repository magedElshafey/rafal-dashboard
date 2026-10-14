import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveDataDesktop,
  ResponsiveDataTable,
  ResponsiveDataTableRow,
  ResponsiveDataTableCell,
  ResponsiveDataMobileCards,
  ResponsiveDataMobileCard,
  ResponsiveDataFact,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import type { BlogPost } from '@/modules/blogs/types/blog-post.types'
function Cover({ url }: { url: string }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  return /^https?:\/\//i.test(url) && !failed ? (
    <img
      src={url}
      alt=""
      loading="lazy"
      width={64}
      height={48}
      className="h-12 w-16 shrink-0 rounded-md object-cover"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-center text-xs">
      {t('blogPosts.noCover')}
    </span>
  )
}
export function BlogPostsList({ items = [], loading = false }: { items?: BlogPost[]; loading?: boolean }) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const rows = loading ? Array.from({ length: 5 }, () => null) : items
  const columns = ['title', 'category', 'author', 'published_at', 'is_featured', 'updated_at'].map((id) => ({
    id,
    header: t(`blogPosts.fields.${id}`),
  }))
  const title = (item: BlogPost) => {
    const other = locale === 'ar' ? 'en' : 'ar'
    const contentLocale = item.title[locale]?.trim() ? locale : other
    const content = item.title[contentLocale]
    const fallback = Boolean(content?.trim()) && contentLocale !== locale
    return (
      <span className="flex min-w-0 items-center gap-3">
        <Cover key={item.coverUrl} url={item.coverUrl} />
        <span className="min-w-0 space-y-1">
          <bdi
            className="line-clamp-2 min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]"
            title={content}
            lang={contentLocale}
            dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}
          >
            {content?.trim() ? content : t('blogPosts.unavailable')}
          </bdi>
          <span className="block text-xs text-muted-foreground">
            {fallback && <>{t(contentLocale === 'ar' ? 'blogPosts.arabicFallback' : 'blogPosts.englishFallback')} · </>}
            {t('blogPosts.readingTime', { count: item.readingTimeMinutes })}
          </span>
        </span>
      </span>
    )
  }
  const category = (item: BlogPost) => (
    <bdi>
      {item.category
        ? item.category.name[locale] || item.category.name.ar || item.category.slug || t('blogPosts.unavailable')
        : t('blogPosts.uncategorized')}
    </bdi>
  )
  const featured = (item: BlogPost) => (
    <Badge variant={item.isFeatured ? 'secondary' : 'outline'}>
      {t(item.isFeatured ? 'blogPosts.yes' : 'blogPosts.no')}
    </Badge>
  )
  const date = (value: string | null) =>
    value ? (
      <time dateTime={value} dir="auto">
        {formatDateTime(value, { locale })}
      </time>
    ) : (
      t('blogPosts.noPublicationDate')
    )
  const placeholder = <Skeleton className="h-5 w-28" />
  return (
    <div aria-hidden={loading || undefined}>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {rows.map((item, index) => (
            <ResponsiveDataTableRow key={item?.id ?? index}>
              <ResponsiveDataTableCell className="max-w-80 whitespace-normal">
                {item ? (
                  title(item)
                ) : (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-16" />
                    <div className="space-y-1">
                      {placeholder}
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                )}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-48 whitespace-normal break-words">
                {item ? category(item) : placeholder}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell className="max-w-40 whitespace-normal break-words">
                {item ? <bdi>{item.authorName || t('blogPosts.unavailable')}</bdi> : placeholder}
              </ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{item ? date(item.publishedAt) : placeholder}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{item ? featured(item) : placeholder}</ResponsiveDataTableCell>
              <ResponsiveDataTableCell>{item ? date(item.updatedAt) : placeholder}</ResponsiveDataTableCell>
            </ResponsiveDataTableRow>
          ))}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>
      <ResponsiveDataMobileCards>
        {rows.map((item, index) => {
          if (!item)
            return (
              <article key={index} className="rounded-xl border border-border bg-surface p-4">
                <header className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </header>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 5 }, (_, fact) => (
                    <div key={fact} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                  ))}
                </div>
              </article>
            )
          return (
            <ResponsiveDataMobileCard
              key={item?.id ?? index}
              title={
                item ? (
                  title(item)
                ) : (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-16" />
                    <div className="space-y-1">
                      {placeholder}
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                )
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('blogPosts.fields.category')}>
                    {item ? category(item) : placeholder}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('blogPosts.fields.author')}>
                    {item ? <bdi>{item.authorName || t('blogPosts.unavailable')}</bdi> : placeholder}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('blogPosts.fields.published_at')}>
                    {item ? date(item.publishedAt) : placeholder}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('blogPosts.fields.is_featured')}>
                    {item ? featured(item) : placeholder}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('blogPosts.fields.updated_at')}>
                    {item ? date(item.updatedAt) : placeholder}
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
