import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FilterSelect from '@/components/filters/FilterSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { useBlogCategories } from '@/modules/blogs/hooks/categories/useBlogCategories'
import {
  blogPostSortValues,
  readBlogPostsFilters,
  validBlogPublishedRange,
} from '@/modules/blogs/utils/blog-post-filters'
export function BlogPostFilters() {
  const { t, i18n } = useTranslation()
  const { forwardQuery, forwardAddQuery } = useQuery()
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categories = useBlogCategories({ search: '', sortBy: null, sortDir: null }, categoryOpen)
  const options =
    categories.data?.pages
      .flatMap((page) => page.items)
      .map((item) => ({
        value: String(item.id),
        label: item.name[i18n.language.startsWith('ar') ? 'ar' : 'en'] || item.name.ar || item.slug,
      })) ?? []
  const selected = forwardQuery?.blog_category_id
  if (selected && !options.some((option) => option.value === selected))
    options.unshift({ value: selected, label: t('blogPosts.categoryId', { id: selected }) })
  const valid = validBlogPublishedRange(readBlogPostsFilters(forwardQuery))
  return (
    <div className="space-y-4">
      <FilterSelect
        name="blog_category_id"
        label={t('blogPosts.fields.category')}
        data={options}
        valueKey="value"
        labelKey="label"
        onOpenChange={setCategoryOpen}
        isError={categories.isError || categories.isPaused}
        isRetrying={categories.isFetching}
        errorMessage={t('blogPosts.categoryError')}
        retryLabel={t('blogPosts.retry')}
        onRetry={() => (categories.isFetchNextPageError ? categories.fetchNextPage() : categories.refetch())}
        isLoading={categories.isLoading}
        isFetchingNextPage={categories.isFetchingNextPage}
        hasNextPage={categories.hasNextPage && !categories.isFetchNextPageError}
        onLoadMore={() => {
          if (!categories.isFetching) return categories.fetchNextPage()
        }}
      />
      {(['is_published', 'is_featured'] as const).map((name) => (
        <FilterSelect
          key={name}
          name={name}
          label={t(`blogPosts.fields.${name}`)}
          data={[
            { value: '1', label: t('blogPosts.yes') },
            { value: '0', label: t('blogPosts.no') },
          ]}
          valueKey="value"
          labelKey="label"
        />
      ))}
      {(['published_from', 'published_to'] as const).map((name) => (
        <div key={name}>
          <Label htmlFor={name}>{t(`blogPosts.fields.${name}`)}</Label>
          <Input
            id={name}
            type="date"
            value={forwardQuery?.[name] ?? ''}
            aria-invalid={!valid}
            aria-describedby={!valid ? 'blog-date-error' : undefined}
            onChange={(event) => forwardAddQuery({ [name]: event.target.value })}
          />
        </div>
      ))}
      {!valid && (
        <p id="blog-date-error" role="alert">
          {t('blogPosts.invalidRange')}
        </p>
      )}
      <FilterSelect
        name="sort_by"
        label={t('blogCategories.sortBy')}
        data={blogPostSortValues.map((value) => ({ value, label: t(`blogPosts.fields.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('blogCategories.sortDir')}
        data={['asc', 'desc'].map((value) => ({ value, label: t(`blogCategories.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
