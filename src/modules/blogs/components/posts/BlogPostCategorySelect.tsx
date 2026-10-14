import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormSelect } from '@/components/form'
import { useBlogCategories } from '../../hooks/categories/useBlogCategories'
import type { BlogPostFormValues } from '../../types/blog-post.types'

export function BlogPostCategorySelect({ disabled }: { disabled: boolean }) {
  const { t, i18n } = useTranslation()
  const [activated, setActivated] = useState(false)
  // Focus (keyboard or pointer) starts the first lookup; typing in other fields does not.
  const query = useBlogCategories({ search: '', sortBy: null, sortDir: null }, activated)
  const selected = useWatch<BlogPostFormValues, 'categoryId'>({ name: 'categoryId' })
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const options =
    query.data?.pages
      .flatMap((page) => page.items)
      .map((item) => ({
        id: item.id,
        name: item.name[language] || item.name.ar || item.name.en || item.slug,
      })) ?? []
  if (selected && !options.some((option) => option.id === selected))
    options.unshift({ id: selected, name: t('blogPosts.categoryId', { id: selected }) })
  return (
    <div onFocusCapture={() => setActivated(true)}>
      <FormSelect
        name="categoryId"
        label={t('blogPosts.categoryOptional')}
        placeholder={t('blogPosts.uncategorized')}
        data={options}
        valueKey="id"
        labelKey="name"
        disabled={disabled}
        clearable
        clearLabel={t('blogPosts.clearCategory')}
        deserializeValue={(value) => (value === '' ? null : Number(value))}
        isLoading={query.isLoading}
        isFetchingNextPage={query.isFetchingNextPage}
        hasNextPage={query.hasNextPage && !query.isError}
        onLoadMore={() => {
          if (!query.isFetching) return query.fetchNextPage()
        }}
        isError={query.isError || query.isPaused}
        isRetrying={query.isFetching}
        errorMessage={t('blogPosts.categoryError')}
        retryLabel={t('blogPosts.retry')}
        onRetry={() => (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
      />
    </div>
  )
}
