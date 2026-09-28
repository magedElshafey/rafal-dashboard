import { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, type Path, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormImageUploader, FormInput, FormTextArea } from '@/components/form'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Button } from '@/components/ui/button'
import { createAboutUsSchema } from '@/modules/about-us/schemas/about-us.schema'
import type { AboutUs, AboutUsFormValues } from '@/modules/about-us/types/about-us.types'
import {
  buildAboutUsUpdatePayload,
  createEmptyAboutUsFeature,
  toAboutUsFormValues,
} from '@/modules/about-us/utils/about-us.utils'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type Props = {
  aboutUs: AboutUs
  isSubmitting: boolean
  onSubmit: (payload: ReturnType<typeof buildAboutUsUpdatePayload>) => Promise<AboutUs>
}

type SectionProps = {
  title: string
  description: string
  children: React.ReactNode
}

function AboutUsSection({ title, description, children }: SectionProps) {
  return (
    <DashboardCard className="space-y-5" padding="lg">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </DashboardCard>
  )
}

function LocalizedInputs({
  name,
  labels,
  multiline = false,
  isSubmitting,
}: {
  name: 'heroTitle' | 'heroSubtitle' | 'story' | 'vision' | 'mission'
  labels: { ar: string; en: string }
  multiline?: boolean
  isSubmitting: boolean
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {multiline ? (
        <>
          <FormTextArea name={`${name}.ar`} label={labels.ar} dir="rtl" rows={5} disabled={isSubmitting} required />
          <FormTextArea name={`${name}.en`} label={labels.en} dir="ltr" rows={5} disabled={isSubmitting} required />
        </>
      ) : (
        <>
          <FormInput name={`${name}.ar`} label={labels.ar} dir="rtl" disabled={isSubmitting} required />
          <FormInput name={`${name}.en`} label={labels.en} dir="ltr" disabled={isSubmitting} required />
        </>
      )}
    </div>
  )
}

function FeaturesSection({ isSubmitting }: { isSubmitting: boolean }) {
  const { t } = useTranslation()
  const { control } = useFormContext<AboutUsFormValues>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'features', keyName: 'fieldId' })
  const isFinalFeature = fields.length === 1

  return (
    <AboutUsSection
      title={t('aboutUs.sections.features.title')}
      description={t('aboutUs.sections.features.description')}
    >
      <div className="space-y-4">
        {fields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            {t('aboutUs.features.empty')}
          </p>
        ) : null}
        {fields.map((feature, index) => (
          <section key={feature.fieldId} className="space-y-5 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-foreground">{t('aboutUs.features.item', { number: index + 1 })}</h3>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isSubmitting || index === 0}
                  aria-label={t('aboutUs.actions.moveUp', { number: index + 1 })}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isSubmitting || index === fields.length - 1}
                  aria-label={t('aboutUs.actions.moveDown', { number: index + 1 })}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-error-500 hover:bg-error-50 hover:text-error-600"
                  disabled={isSubmitting || isFinalFeature}
                  aria-label={t('aboutUs.actions.removeFeature', { number: index + 1 })}
                  aria-describedby={isFinalFeature ? 'about-us-final-feature-removal-help' : undefined}
                  onClick={() => remove(index)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                name={`features.${index}.title.ar`}
                label={t('aboutUs.fields.featureTitleAr')}
                dir="rtl"
                disabled={isSubmitting}
                required
              />
              <FormInput
                name={`features.${index}.title.en`}
                label={t('aboutUs.fields.featureTitleEn')}
                dir="ltr"
                disabled={isSubmitting}
                required
              />
              <FormTextArea
                name={`features.${index}.subtitle.ar`}
                label={t('aboutUs.fields.featureSubtitleAr')}
                dir="rtl"
                disabled={isSubmitting}
                required
              />
              <FormTextArea
                name={`features.${index}.subtitle.en`}
                label={t('aboutUs.fields.featureSubtitleEn')}
                dir="ltr"
                disabled={isSubmitting}
                required
              />
            </div>
            <FormImageUploader<AboutUsFormValues>
              name={`features.${index}.icon` as Path<AboutUsFormValues>}
              label={t('aboutUs.fields.featureIcon')}
              mode="single"
              accept="image/*"
              existingImages={
                feature.iconUrl
                  ? [{ id: feature.fieldId, url: feature.iconUrl, alt: t('aboutUs.media.featureIconAlt') }]
                  : []
              }
              allowExistingRemoval={false}
              previewFit="contain"
              disabled={isSubmitting}
            />
            {feature.iconUrl ? (
              <p className="text-xs text-muted-foreground">{t('aboutUs.media.deleteUnavailable')}</p>
            ) : null}
          </section>
        ))}
        {isFinalFeature ? (
          <p id="about-us-final-feature-removal-help" className="text-sm text-muted-foreground">
            {t('aboutUs.features.finalRemovalUnavailable')}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => append(createEmptyAboutUsFeature())}
        >
          <Plus aria-hidden="true" />
          {t('aboutUs.actions.addFeature')}
        </Button>
      </div>
    </AboutUsSection>
  )
}

function buildValidationAliases(featureCount: number): Record<string, Path<AboutUsFormValues>> {
  const aliases: Record<string, Path<AboutUsFormValues>> = {
    'hero_title.ar': 'heroTitle.ar',
    'hero_title.en': 'heroTitle.en',
    'hero_subtitle.ar': 'heroSubtitle.ar',
    'hero_subtitle.en': 'heroSubtitle.en',
    'story.ar': 'story.ar',
    'story.en': 'story.en',
    'vision.ar': 'vision.ar',
    'vision.en': 'vision.en',
    'mission.ar': 'mission.ar',
    'mission.en': 'mission.en',
    hero: 'hero',
  }
  for (let index = 0; index < featureCount; index += 1) {
    aliases[`features.${index}.title.ar`] = `features.${index}.title.ar`
    aliases[`features.${index}.title.en`] = `features.${index}.title.en`
    aliases[`features.${index}.subtitle.ar`] = `features.${index}.subtitle.ar`
    aliases[`features.${index}.subtitle.en`] = `features.${index}.subtitle.en`
    aliases[`features.${index}.icon`] = `features.${index}.icon`
  }
  return aliases
}

export function AboutUsForm({ aboutUs, isSubmitting, onSubmit }: Props) {
  const { t } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const submissionLockRef = useRef(false)
  const initialValues = useMemo(() => toAboutUsFormValues(aboutUs), [aboutUs])
  const schema = useMemo(() => createAboutUsSchema({ required: t('aboutUs.validation.required') }), [t])

  const handleSubmit = async (values: AboutUsFormValues, methods: UseFormReturn<AboutUsFormValues>) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      const dirtyFields = methods.formState.dirtyFields
      const effectiveDirtyFields =
        methods.getFieldState('features').isDirty && dirtyFields.features === undefined
          ? { ...dirtyFields, features: [] }
          : dirtyFields
      const updated = await onSubmit(buildAboutUsUpdatePayload(values, effectiveDirtyFields))
      methods.reset(toAboutUsFormValues(updated))
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, buildValidationAliases(values.features.length))
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <FormWrapper<AboutUsFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={aboutUs.id}
      validationMode="onChange"
      submissionDisabled={isSubmitting}
      onFormStateChange={setFormState}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <AboutUsSection title={t('aboutUs.sections.hero.title')} description={t('aboutUs.sections.hero.description')}>
        <LocalizedInputs
          name="heroTitle"
          labels={{ ar: t('aboutUs.fields.heroTitleAr'), en: t('aboutUs.fields.heroTitleEn') }}
          isSubmitting={isSubmitting}
        />
        <LocalizedInputs
          name="heroSubtitle"
          labels={{ ar: t('aboutUs.fields.heroSubtitleAr'), en: t('aboutUs.fields.heroSubtitleEn') }}
          isSubmitting={isSubmitting}
        />
        <FormImageUploader<AboutUsFormValues>
          name="hero"
          label={t('aboutUs.fields.heroImage')}
          mode="single"
          accept="image/*"
          existingImages={
            initialValues.heroImageUrl
              ? [{ id: 'about-us-hero-preview', url: initialValues.heroImageUrl, alt: t('aboutUs.media.heroAlt') }]
              : []
          }
          allowExistingRemoval={false}
          previewFit="cover"
          disabled={isSubmitting}
        />
        {initialValues.heroImageUrl ? (
          <p className="text-xs text-muted-foreground">{t('aboutUs.media.deleteUnavailable')}</p>
        ) : null}
      </AboutUsSection>

      <AboutUsSection title={t('aboutUs.sections.story.title')} description={t('aboutUs.sections.story.description')}>
        <LocalizedInputs
          name="story"
          labels={{ ar: t('aboutUs.fields.storyAr'), en: t('aboutUs.fields.storyEn') }}
          multiline
          isSubmitting={isSubmitting}
        />
      </AboutUsSection>
      <AboutUsSection title={t('aboutUs.sections.vision.title')} description={t('aboutUs.sections.vision.description')}>
        <LocalizedInputs
          name="vision"
          labels={{ ar: t('aboutUs.fields.visionAr'), en: t('aboutUs.fields.visionEn') }}
          multiline
          isSubmitting={isSubmitting}
        />
      </AboutUsSection>
      <AboutUsSection
        title={t('aboutUs.sections.mission.title')}
        description={t('aboutUs.sections.mission.description')}
      >
        <LocalizedInputs
          name="mission"
          labels={{ ar: t('aboutUs.fields.missionAr'), en: t('aboutUs.fields.missionEn') }}
          multiline
          isSubmitting={isSubmitting}
        />
      </AboutUsSection>
      <FeaturesSection isSubmitting={isSubmitting} />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || !formState.isDirty || !formState.isValid}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isSubmitting ? t('aboutUs.actions.saving') : t('aboutUs.actions.save')}
        </Button>
      </div>
    </FormWrapper>
  )
}
