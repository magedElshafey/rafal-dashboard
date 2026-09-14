import type { BaseSyntheticEvent } from 'react'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormInput, FormSelect, FormSortOrder, FormTextArea } from '@/components/form'
import { CategoryImage } from '@/modules/categories/components/CategoryImage'
import { useCategories } from '@/modules/categories/hooks/useCategories'
import { createCategorySchema } from '@/modules/categories/schemas/category.schema'
import type { Category, CategoryFormValues } from '@/modules/categories/types/category.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type CategorySubmitIntent = 'create' | 'create-another' | 'edit'

type CategoryFormProps = {
  formId: string
  mode: 'create' | 'edit'
  category?: Category
  isSubmitting: boolean
  onDirtyChange: (isDirty: boolean) => void
  onSubmit: (
    values: CategoryFormValues,
    intent: CategorySubmitIntent,
    methods: UseFormReturn<CategoryFormValues>
  ) => Promise<void>
}

export const EMPTY_CATEGORY_FORM_VALUES: CategoryFormValues = {
  parent_id: null,
  name: { ar: '', en: '' },
  slug: '',
  description: { ar: '', en: '' },
  is_active: true,
  sort_order: 0,
}

export function CategoryForm({ formId, mode, category, isSubmitting, onDirtyChange, onSubmit }: CategoryFormProps) {
  const { t, i18n } = useTranslation()
  const categoriesQuery = useCategories()
  const categories = useMemo(
    () => categoriesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [categoriesQuery.data]
  )
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const selectableCategories = categories.filter((item) => item.id !== category?.id)
  const currentParentLoaded = selectableCategories.some((item) => item.id === category?.parent_id)
  const parentOptions = [
    { value: 'root', label: t('categories.parent.root') },
    ...selectableCategories.map((item) => ({ value: String(item.id), label: item.name[language] })),
    ...(category?.parent_id !== null && category?.parent_id !== undefined && !currentParentLoaded
      ? [{ value: String(category.parent_id), label: t('categories.parent.idFallback', { id: category.parent_id }) }]
      : []),
  ]
  const schema = useMemo(
    () =>
      createCategorySchema({
        nameArRequired: t('categories.validation.nameArRequired'),
        nameEnRequired: t('categories.validation.nameEnRequired'),
        slugRequired: t('categories.validation.slugRequired'),
        sortRequired: t('categories.validation.sortRequired'),
        sortInteger: t('categories.validation.sortInteger'),
        sortNonNegative: t('categories.validation.sortNonNegative'),
      }),
    [t]
  )
  const resetValues = useMemo<CategoryFormValues>(
    () =>
      category
        ? {
            parent_id: category.parent_id,
            name: { ...category.name },
            slug: category.slug,
            description: category.description ? { ...category.description } : { ar: '', en: '' },
            is_active: category.is_active,
            sort_order: category.sort_order,
          }
        : EMPTY_CATEGORY_FORM_VALUES,
    [category]
  )
  const hasParentError = categoriesQuery.isError || categoriesQuery.isFetchNextPageError

  const handleSubmit = async (
    values: CategoryFormValues,
    methods: UseFormReturn<CategoryFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? mode) as CategorySubmitIntent
    const normalized: CategoryFormValues = {
      ...values,
      name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
      slug: values.slug.trim(),
      description: { ar: values.description.ar.trim(), en: values.description.en.trim() },
    }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        'name[ar]': 'name.ar',
        'name[en]': 'name.en',
        'description[ar]': 'description.ar',
        'description[en]': 'description.en',
        parent_id: 'parent_id',
        sort_order: 'sort_order',
      })
    }
  }

  return (
    <FormWrapper<CategoryFormValues>
      schema={schema}
      defaultValues={resetValues}
      resetValues={resetValues}
      resetValuesKey={category?.id ?? 'create'}
      formId={formId}
      className="space-y-7"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      {mode === 'edit' && category ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-content-primary">{t('categories.fields.currentImage')}</p>
          <CategoryImage url={category.image_url} alt={category.name[language]} className="size-24" />
          <p className="text-xs text-content-secondary">{t('categories.form.imageReadOnly')}</p>
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput name="name.ar" label={t('categories.fields.nameAr')} dir="rtl" required autoFocus />
        <FormInput name="name.en" label={t('categories.fields.nameEn')} dir="ltr" required />
      </div>
      <FormInput name="slug" label={t('categories.fields.slug')} dir="ltr" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormTextArea name="description.ar" label={t('categories.fields.descriptionAr')} dir="rtl" />
        <FormTextArea name="description.en" label={t('categories.fields.descriptionEn')} dir="ltr" />
      </div>
      <FormSelect
        name="parent_id"
        label={t('categories.fields.parent')}
        data={parentOptions}
        valueKey="value"
        labelKey="label"
        serializeValue={(value) => (value === null || value === undefined ? 'root' : String(value))}
        deserializeValue={(value) => (value === 'root' || value === '' ? null : Number(value))}
        disabled={isSubmitting}
        isLoading={categoriesQuery.isLoading}
        isFetchingNextPage={categoriesQuery.isFetchingNextPage}
        hasNextPage={categoriesQuery.hasNextPage}
        onLoadMore={categoriesQuery.fetchNextPage}
        isError={hasParentError}
        isRetrying={categoriesQuery.isFetching}
        onRetry={categoriesQuery.isFetchNextPageError ? categoriesQuery.fetchNextPage : () => categoriesQuery.refetch()}
        emptyMessage={t('categories.parent.empty')}
        loadingMessage={t('categories.parent.loading')}
        loadMoreMessage={t('categories.parent.loadMore')}
        errorMessage={t('categories.parent.error')}
        retryLabel={t('categories.parent.retry')}
      />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <FormSortOrder
          name="sort_order"
          label={t('categories.fields.sortOrder')}
          min={0}
          disabled={isSubmitting}
          required
        />
        <div className="pt-8">
          <FormCheckbox name="is_active" label={t('categories.fields.active')} disabled={isSubmitting} />
        </div>
      </div>
    </FormWrapper>
  )
}
