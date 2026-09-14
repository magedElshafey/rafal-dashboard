import { useCallback, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import {
  CategoryForm,
  type CategorySubmitIntent,
  EMPTY_CATEGORY_FORM_VALUES,
} from '@/modules/categories/components/CategoryForm'
import { CategoryFormSkeleton } from '@/modules/categories/components/CategoryFormSkeleton'
import { useCategory } from '@/modules/categories/hooks/useCategory'
import { useCreateCategory } from '@/modules/categories/hooks/useCreateCategory'
import { useUpdateCategory } from '@/modules/categories/hooks/useUpdateCategory'
import type { Category, CategoryFormValues, CategoryPayload } from '@/modules/categories/types/category.types'

type CategoryDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  categoryId: number | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'category-form'

function toPayload(values: CategoryFormValues): CategoryPayload {
  const description = values.description.ar || values.description.en ? values.description : null
  return { ...values, description }
}

function toFormValues(category: Category): CategoryFormValues {
  return {
    parent_id: category.parent_id,
    name: { ...category.name },
    slug: category.slug,
    description: category.description ? { ...category.description } : { ar: '', en: '' },
    is_active: category.is_active,
    sort_order: category.sort_order,
  }
}

export function CategoryDrawer({ open, mode, categoryId, onOpenChange }: CategoryDrawerProps) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const submissionLockRef = useRef(false)
  const detail = useCategory(categoryId, open && mode === 'edit')
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory(categoryId)
  const isSubmitting = createCategory.isPending || updateCategory.isPending
  const isDetailLoading = mode === 'edit' && detail.isFetching && !detail.isError
  const isDetailError = mode === 'edit' && detail.isError
  const isDetailReady = mode === 'create' || detail.isSuccess
  const handleDirtyChange = useCallback((nextIsDirty: boolean) => setIsDirty(nextIsDirty), [])

  const handleSubmit = async (
    values: CategoryFormValues,
    intent: CategorySubmitIntent,
    methods: UseFormReturn<CategoryFormValues>
  ) => {
    if (submissionLockRef.current || (mode === 'edit' && !isDirty)) return
    submissionLockRef.current = true
    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(toPayload(values))
        methods.reset(EMPTY_CATEGORY_FORM_VALUES)
        if (intent === 'create-another') {
          window.requestAnimationFrame(() => methods.setFocus('name.ar'))
          return
        }
        onOpenChange(false)
        return
      }

      const response = await updateCategory.mutateAsync(toPayload(values))
      methods.reset(toFormValues(response.data))
      onOpenChange(false)
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('categories.createCategory'), edit: t('categories.editCategory') }}
      descriptions={{ create: t('categories.form.createDescription'), edit: t('categories.form.editDescription') }}
      submitLabels={{ create: t('categories.actions.create'), edit: t('categories.actions.update') }}
      createAnotherLabel={t('categories.actions.createAnother')}
      cancelLabel={t('categories.actions.cancel')}
      closeLabel={t('categories.actions.close')}
      formId={FORM_ID}
      isLoading={isDetailLoading}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isDetailReady)}
      loadingContent={<CategoryFormSkeleton />}
      errorContent={
        isDetailError ? (
          <QueryStateNotice kind="loading-error" isRetrying={detail.isFetching} onRetry={() => void detail.refetch()} />
        ) : undefined
      }
    >
      {isDetailReady ? (
        <CategoryForm
          key={`${mode}-${categoryId ?? 'new'}-${open}`}
          formId={FORM_ID}
          mode={mode}
          category={detail.data?.data}
          isSubmitting={isSubmitting}
          onDirtyChange={handleDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
