import { useMemo, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useFormContext, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput, FormTextArea } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Button } from '@/components/ui/button'
import { createStaticPageSchema } from '@/modules/static-pages/schemas/static-page.schema'
import type {
  StaticPage,
  StaticPageCreatePayload,
  StaticPageFormValues,
  StaticPageUpdatePayload,
} from '@/modules/static-pages/types/static-page.types'
import {
  buildStaticPageCreatePayload,
  buildStaticPageUpdatePayload,
  normalizeStaticPageSlug,
  toStaticPageFormValues,
} from '@/modules/static-pages/utils/static-page.utils'
import { Routes } from '@/routes/routes'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export const EMPTY_STATIC_PAGE_FORM_VALUES: StaticPageFormValues = {
  slug: '',
  title: { ar: '', en: '' },
  content: { ar: '', en: '' },
  isPublished: false,
  isSystem: false,
}

const API_FIELD_ALIASES = {
  slug: 'slug',
  'title.ar': 'title.ar',
  'title[ar]': 'title.ar',
  'title.en': 'title.en',
  'title[en]': 'title.en',
  'content.ar': 'content.ar',
  'content[ar]': 'content.ar',
  'content.en': 'content.en',
  'content[en]': 'content.en',
  is_published: 'isPublished',
  is_system: 'isSystem',
} as const

type CommonProps = {
  isSubmitting: boolean
}

type Props =
  | (CommonProps & {
      mode: 'create'
      onSubmit: (payload: StaticPageCreatePayload) => Promise<StaticPage>
    })
  | (CommonProps & {
      mode: 'edit'
      page: StaticPage
      onSubmit: (payload: StaticPageUpdatePayload) => Promise<StaticPage>
    })

function SlugField({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const { getFieldState, setValue } = useFormContext<StaticPageFormValues>()
  const helperId = 'static-page-slug-help'

  return (
    <div className="space-y-1">
      <FormInput
        name="slug"
        label={t('staticPages.fields.slug')}
        dir="ltr"
        autoComplete="off"
        aria-describedby={helperId}
        disabled={disabled}
        required
        onBlur={(event) => {
          const isDirty = getFieldState('slug').isDirty
          const value = isDirty ? normalizeStaticPageSlug(event.currentTarget.value) : event.currentTarget.value
          setValue('slug', value, { shouldDirty: isDirty, shouldTouch: true, shouldValidate: true })
        }}
      />
      <p id={helperId} className="text-xs text-muted-foreground">
        {t('staticPages.form.slugHelp')}
      </p>
    </div>
  )
}

export function StaticPageForm(props: Props) {
  const { t } = useTranslation()
  const submissionLockRef = useRef(false)
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const initialValues = useMemo(
    () => (props.mode === 'edit' ? toStaticPageFormValues(props.page) : EMPTY_STATIC_PAGE_FORM_VALUES),
    [props]
  )
  const schema = useMemo(
    () => createStaticPageSchema({ slugRequired: t('staticPages.validation.slugRequired') }),
    [t]
  )

  const handleSubmit = async (values: StaticPageFormValues, methods: UseFormReturn<StaticPageFormValues>) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      if (props.mode === 'create') {
        await props.onSubmit(buildStaticPageCreatePayload(values))
      } else {
        const updated = await props.onSubmit(buildStaticPageUpdatePayload(values, methods.formState.dirtyFields))
        methods.reset(toStaticPageFormValues(updated))
      }
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, API_FIELD_ALIASES)
    } finally {
      submissionLockRef.current = false
    }
  }

  const isEdit = props.mode === 'edit'

  return (
    <FormWrapper<StaticPageFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={isEdit ? props.page.id : 'create'}
      validationMode="onChange"
      submissionDisabled={props.isSubmitting}
      onFormStateChange={setFormState}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <DashboardCard className="space-y-5" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('staticPages.sections.basic')}</h2>
        <SlugField disabled={props.isSubmitting} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormSwitch
            name="isPublished"
            label={t('staticPages.fields.isPublished')}
            disabled={props.isSubmitting}
          />
          <FormSwitch name="isSystem" label={t('staticPages.fields.isSystem')} disabled={props.isSubmitting} />
        </div>
      </DashboardCard>

      <DashboardCard className="space-y-5" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('staticPages.sections.arabic')}</h2>
        <FormInput name="title.ar" label={t('staticPages.fields.titleAr')} dir="rtl" disabled={props.isSubmitting} />
        <FormTextArea
          name="content.ar"
          label={t('staticPages.fields.contentAr')}
          dir="rtl"
          rows={10}
          disabled={props.isSubmitting}
        />
      </DashboardCard>

      <DashboardCard className="space-y-5" padding="lg">
        <h2 className="text-lg font-semibold text-foreground">{t('staticPages.sections.english')}</h2>
        <FormInput name="title.en" label={t('staticPages.fields.titleEn')} dir="ltr" disabled={props.isSubmitting} />
        <FormTextArea
          name="content.en"
          label={t('staticPages.fields.contentEn')}
          dir="ltr"
          rows={10}
          disabled={props.isSubmitting}
        />
      </DashboardCard>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg">
          <Link to={Routes.staticPages}>{t('staticPages.actions.cancel')}</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={props.isSubmitting || !formState.isValid || (isEdit && !formState.isDirty)}
        >
          {props.isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {props.isSubmitting
            ? t(isEdit ? 'staticPages.actions.saving' : 'staticPages.actions.creating')
            : t(isEdit ? 'staticPages.actions.save' : 'staticPages.actions.create')}
        </Button>
      </div>
    </FormWrapper>
  )
}
