import { BlogPostCategorySelect } from './BlogPostCategorySelect'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput, FormTextArea, FormCheckbox } from '@/components/form'
import { FormImageUploader } from '@/components/form/image-upload/FormImageUploader'
import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { getApiErrorMessage } from '@/utils/error/api-error.helpers'
import { useCreateBlogPost } from '@/modules/blogs/hooks/posts/useCreateBlogPost'
import { createBlogPostFormSchema } from '@/modules/blogs/schemas/blog-post.schema'
import type { BlogPostFormValues } from '@/modules/blogs/types/blog-post.types'
const empty: BlogPostFormValues = {
  slug: '',
  title: { ar: '', en: '' },
  excerpt: { ar: '', en: '' },
  body: { ar: '', en: '' },
  categoryId: null,
  authorName: '',
  isFeatured: false,
  cover: { files: [], removedExistingIds: [] },
}
export function BlogPostCreateDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const mutation = useCreateBlogPost()
  const lock = useRef(false)
  const [state, setState] = useState({ isDirty: false, isValid: false })
  const [error, setError] = useState<string | null>(null)
  return (
    <EntityFormDrawer
      open={open}
      mode="create"
      onOpenChange={onOpenChange}
      titles={{ create: t('blogPosts.create') }}
      descriptions={{ create: t('blogPosts.createDescription') }}
      submitLabels={{ create: mutation.isPending ? t('blogPosts.saving') : t('blogPosts.save') }}
      createAnotherLabel={t('blogPosts.createAnother')}
      cancelLabel={t('button.cancel')}
      closeLabel={t('common.close')}
      formId="blog-post-create"
      isSubmitting={mutation.isPending}
      isSubmitDisabled={!state.isValid}
    >
      <FormWrapper<BlogPostFormValues>
        key={String(open)}
        formId="blog-post-create"
        defaultValues={empty}
        schema={createBlogPostFormSchema(
          t('blogPosts.required'),
          t('blogPosts.invalidImage'),
          t('blogs.invalidSlug'),
          t('blogPosts.invalidCategory')
        )}
        className="space-y-5"
        validationMode="onChange"
        onFormStateChange={setState}
        submissionDisabled={mutation.isPending}
        onSubmit={async (values, methods, event) => {
          if (lock.current || mutation.isPending) return
          lock.current = true
          setError(null)
          try {
            await mutation.mutateAsync(values)
            methods.reset(empty)
            const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
            if (submitter?.dataset.submitIntent === 'create-another')
              window.requestAnimationFrame(() => methods.setFocus('title.ar'))
            else onOpenChange(false)
          } catch (failure) {
            setError(getApiErrorMessage(failure, t('blogPosts.createError')))
            applyApiValidationErrors(failure, methods.setError, {
              slug: 'title.en',
              category_id: 'categoryId',
              title: 'title.ar',
              'title.ar': 'title.ar',
              'title.en': 'title.en',
              'title[ar]': 'title.ar',
              excerpt: 'excerpt.ar',
              'excerpt.ar': 'excerpt.ar',
              'excerpt.en': 'excerpt.en',
              'excerpt[ar]': 'excerpt.ar',
              body: 'body.ar',
              'body.ar': 'body.ar',
              'body.en': 'body.en',
              'body[ar]': 'body.ar',
              author_name: 'authorName',
              is_featured: 'isFeatured',
              cover: 'cover',
            })
          } finally {
            lock.current = false
          }
        }}
      >
        {error && <p role="alert">{error}</p>}
        {(['ar', 'en'] as const).map((language) => (
          <fieldset key={language} className="space-y-4">
            <legend className="mb-3 font-semibold">
              {t(language === 'ar' ? 'blogPosts.arabicContent' : 'blogPosts.englishContent')}
            </legend>
            <FormInput
              name={'title.' + language}
              label={t(language === 'ar' ? 'blogPosts.titleAr' : 'blogPosts.titleEn')}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              required
              autoFocus={language === 'ar'}
              disabled={mutation.isPending}
            />
            <FormTextArea
              name={'excerpt.' + language}
              label={t(language === 'ar' ? 'blogPosts.excerptAr' : 'blogPosts.excerptEn')}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              rows={3}
              required
              disabled={mutation.isPending}
            />
            <FormTextArea
              name={'body.' + language}
              label={t(language === 'ar' ? 'blogPosts.bodyAr' : 'blogPosts.bodyEn')}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              rows={8}
              required
              disabled={mutation.isPending}
            />
          </fieldset>
        ))}
        <BlogPostCategorySelect disabled={mutation.isPending} />
        <FormInput
          name="authorName"
          label={t('blogPosts.fields.author')}
          dir="auto"
          required
          disabled={mutation.isPending}
        />
        <FormCheckbox name="isFeatured" label={t('blogPosts.fields.is_featured')} disabled={mutation.isPending} />
        <FormImageUploader<BlogPostFormValues>
          name="cover"
          label={t('blogPosts.cover')}
          mode="single"
          accept="image/*"
          required
          disabled={mutation.isPending}
        />
        <p className="text-sm text-muted-foreground">{t('blogPosts.coverHelp')}</p>
      </FormWrapper>
    </EntityFormDrawer>
  )
}
