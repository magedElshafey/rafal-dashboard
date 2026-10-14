import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form'
import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'
import { useCreateBlogCategory } from '@/modules/blogs/hooks/categories/useCreateBlogCategory'
import { useUpdateBlogCategory } from '@/modules/blogs/hooks/categories/useUpdateBlogCategory'
import { createBlogCategoryFormSchema } from '@/modules/blogs/schemas/blog-category.schema'
import type { BlogCategory, BlogCategoryFormValues } from '@/modules/blogs/types/blog-category.types'
const empty: BlogCategoryFormValues = { slug: '', name: { ar: '', en: '' } }
export function BlogCategoryDrawer({ category, onClose }: { category: BlogCategory | null; onClose: () => void }) {
  const { t } = useTranslation()
  const mode = category ? 'edit' : 'create'
  const create = useCreateBlogCategory()
  const update = useUpdateBlogCategory()
  const pending = create.isPending || update.isPending
  const lock = useRef(false)
  const [state, setState] = useState({ isDirty: false, isValid: false })
  const [error, setError] = useState<string | null>(null)
  return (
    <EntityFormDrawer
      open
      mode={mode}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      titles={{ create: t('blogCategories.create'), edit: t('blogCategories.edit') }}
      descriptions={{ create: t('blogCategories.formDescription'), edit: t('blogCategories.formDescription') }}
      submitLabels={{ create: t('blogCategories.create'), edit: t('blogCategories.update') }}
      createAnotherLabel={t('blogPosts.createAnother')}
      cancelLabel={t('button.cancel')}
      closeLabel={t('common.close')}
      formId="blog-category-form"
      isSubmitting={pending}
      isSubmitDisabled={!state.isValid || (mode === 'edit' && !state.isDirty)}
    >
      <FormWrapper<BlogCategoryFormValues>
        formId="blog-category-form"
        defaultValues={category ? { slug: category.slug, name: category.name } : empty}
        schema={createBlogCategoryFormSchema(t('blogPosts.required'), t('blogs.invalidSlug'), mode)}
        validationMode="onChange"
        onFormStateChange={setState}
        submissionDisabled={pending}
        className="space-y-5"
        onSubmit={async (values, methods, event) => {
          if (lock.current || pending || (mode === 'edit' && !state.isDirty)) return
          lock.current = true
          setError(null)
          try {
            const result = category
              ? await update.mutateAsync({ id: category.id, values: { ...values, slug: category.slug } })
              : await create.mutateAsync(values)
            methods.reset(category ? { slug: result.slug, name: result.name } : empty)
            const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
            if (!category && submitter?.dataset.submitIntent === 'create-another')
              window.requestAnimationFrame(() => methods.setFocus('name.ar'))
            else onClose()
          } catch (failure) {
            setError(
              getApiErrorMessage(failure, t(category ? 'blogCategories.updateError' : 'blogCategories.createError'))
            )
            applyApiValidationErrors<BlogCategoryFormValues>(
              failure,
              (field, detail, options) => {
                if (category && field === 'slug') setError(detail.message ?? t('blogCategories.updateError'))
                else methods.setError(field, detail, options)
              },
              {
                slug: category ? 'slug' : 'name.en',
                name: 'name.ar',
                'name.ar': 'name.ar',
                'name[ar]': 'name.ar',
                'name.en': 'name.en',
                'name[en]': 'name.en',
              }
            )
          } finally {
            lock.current = false
          }
        }}
      >
        {error && <p role="alert">{error}</p>}
        <FormInput name="name.ar" label={t('blogCategories.nameAr')} dir="rtl" required autoFocus disabled={pending} />
        <FormInput name="name.en" label={t('blogCategories.nameEn')} dir="ltr" required disabled={pending} />
      </FormWrapper>
    </EntityFormDrawer>
  )
}
