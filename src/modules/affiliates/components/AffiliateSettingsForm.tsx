import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPage } from '@/modules/static-pages/types/static-page.types'
import { emptyPagesFilters } from '@/modules/static-pages/utils/static-page-filters'
import { createAffiliateSettingsSchema } from '../schemas/affiliate-settings.schema'
import type {
  AffiliateSettings,
  AffiliateSettingsFormValues,
  UpdateAffiliateSettingsPayload,
} from '../types/affiliate.types'
import { toAffiliateSettingsFormValues, buildAffiliateSettingsPayload } from '../utils/affiliate-settings'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type Props = {
  settings: AffiliateSettings
  isSubmitting: boolean
  canWrite?: boolean
  onSubmit: (payload: UpdateAffiliateSettingsPayload) => Promise<AffiliateSettings>
}
function Fields({
  settings,
  disabled,
  pages,
}: {
  settings: AffiliateSettings
  disabled: boolean
  pages: ReturnType<typeof useInfinitePaginatedQuery<StaticPage>>
}) {
  const { t, i18n } = useTranslation()
  const {
    reset,
    formState: { isDirty },
  } = useFormContext<AffiliateSettingsFormValues>()
  useEffect(() => {
    if (!isDirty) reset(toAffiliateSettingsFormValues(settings))
  }, [settings, isDirty, reset])
  const options =
    pages.data?.pages
      .flatMap((p) => p.items)
      .filter((p) => p.isPublished)
      .map((p) => ({
        id: p.id,
        label: (i18n.language.startsWith('ar') ? p.title.ar : p.title.en) || p.title.ar || p.title.en || p.slug,
      })) ?? []
  const selectedPage = settings.termsPage
  if (
    selectedPage?.isPublished &&
    !pages.data?.pages.some((page) => page.items.some((item) => item.id === selectedPage.id))
  ) {
    const title = selectedPage.title
    options.unshift({
      id: selectedPage.id,
      label:
        typeof title === 'string'
          ? title
          : (i18n.language.startsWith('ar') ? title.ar : title.en) || title.ar || title.en || String(selectedPage.id),
    })
  }
  return (
    <DashboardCard padding="lg" className="space-y-5">
      <FormSwitch name="programEnabled" label={t('affiliates.settings.fields.programEnabled')} disabled={disabled} />
      <p className="text-sm text-muted-foreground">{t('affiliates.settings.help.programEnabled')}</p>
      <FormSwitch
        name="applicationsEnabled"
        label={t('affiliates.settings.fields.applicationsEnabled')}
        disabled={disabled}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          name="customerDiscountPercentage"
          type="number"
          min={1}
          max={50}
          step="0.01"
          dir="ltr"
          label={t('affiliates.settings.fields.customerDiscountPercentage')}
          disabled={disabled}
          required
        />
        <FormInput
          name="affiliateCommissionPercentage"
          type="number"
          min={0.5}
          max={50}
          step="0.01"
          dir="ltr"
          label={t('affiliates.settings.fields.affiliateCommissionPercentage')}
          disabled={disabled}
          required
        />
        <FormInput
          name="minimumPayoutAmount"
          inputMode="decimal"
          dir="ltr"
          label={t('affiliates.settings.fields.minimumPayoutAmount')}
          disabled={disabled}
          required
        />
        <FormSelect
          name="termsPageId"
          label={t('affiliates.settings.fields.termsPageId')}
          data={options}
          valueKey="id"
          labelKey="label"
          disabled={disabled}
          deserializeValue={(value) => (value ? Number(value) : null)}
          serializeValue={(value) => (value == null ? '' : String(value))}
          isLoading={pages.isLoading}
          isError={pages.isError}
          onRetry={() => pages.refetch()}
          isRetrying={pages.isFetching}
          hasNextPage={pages.hasNextPage}
          isFetchingNextPage={pages.isFetchingNextPage}
          onLoadMore={() => pages.fetchNextPage().then(() => undefined)}
          required
        />
      </div>
      <p className="text-sm text-muted-foreground">{t('affiliates.settings.help.termsPageId')}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => reset(toAffiliateSettingsFormValues(settings))}
        disabled={disabled || !isDirty}
      >
        {t('affiliates.settings.actions.discard')}
      </Button>
    </DashboardCard>
  )
}
export function AffiliateSettingsForm({ settings, isSubmitting, canWrite = false, onSubmit }: Props) {
  const { t } = useTranslation()
  const lock = useRef(false)
  const pages = useInfinitePaginatedQuery({
    queryKey: staticPagesKeys.list(emptyPagesFilters),
    queryFn: (page, signal) => {
      if (!canWrite) throw new Error('Page access unavailable')
      return staticPagesService.list(page, signal)
    },
    enabled: canWrite,
    retry: false,
  })
  const [pending, setPending] = useState<{
    values: AffiliateSettingsFormValues
    methods: UseFormReturn<AffiliateSettingsFormValues>
  } | null>(null)
  const [state, setState] = useState({ isDirty: false, isValid: false })
  const schema = useMemo(
    () =>
      createAffiliateSettingsSchema({
        required: t('affiliates.settings.validation.required'),
        validNumber: t('affiliates.settings.validation.validNumber'),
        percentageRange: t('affiliates.settings.validation.percentageRange'),
        payoutFormat: t('affiliates.settings.validation.payoutFormat'),
        payoutPositive: t('affiliates.settings.validation.payoutPositive'),
        termsSlug: t('affiliates.settings.validation.termsPage'),
      }),
    [t]
  )
  const save = async (values: AffiliateSettingsFormValues, methods: UseFormReturn<AffiliateSettingsFormValues>) => {
    if (!canWrite || lock.current) return
    const loadedPage = pages.data?.pages.flatMap((page) => page.items).find((page) => page.id === values.termsPageId)
    const isPublished = loadedPage
      ? loadedPage.isPublished
      : settings.termsPage?.id === values.termsPageId && settings.termsPage.isPublished
    if (
      values.termsPageId === null ||
      !Number.isSafeInteger(values.termsPageId) ||
      values.termsPageId < 1 ||
      !isPublished
    ) {
      methods.setError('termsPageId', { type: 'server', message: t('affiliates.settings.validation.termsPage') })
      return
    }
    lock.current = true
    try {
      const result = await onSubmit(buildAffiliateSettingsPayload(settings, values))
      methods.reset(toAffiliateSettingsFormValues(result))
      setPending(null)
    } catch (error) {
      setPending(null)
      applyApiValidationErrors(
        error,
        methods.setError,
        {
          enabled: 'programEnabled',
          applications_enabled: 'applicationsEnabled',
          customer_discount_percent: 'customerDiscountPercentage',
          commission_percent: 'affiliateCommissionPercentage',
          min_payout: 'minimumPayoutAmount',
          terms_page_id: 'termsPageId',
        },
        [
          'enabled',
          'applications_enabled',
          'customer_discount_percent',
          'commission_percent',
          'min_payout',
          'terms_page_id',
        ]
      )
    } finally {
      lock.current = false
    }
  }
  return (
    <FormWrapper<AffiliateSettingsFormValues>
      schema={schema}
      defaultValues={toAffiliateSettingsFormValues(settings)}
      validationMode="onChange"
      onFormStateChange={setState}
      submissionDisabled={!canWrite || isSubmitting}
      onSubmit={async (values, methods) => {
        if (settings.programEnabled && !values.programEnabled) {
          setPending({ values, methods })
          return
        }
        await save(values, methods)
      }}
      className="space-y-5"
    >
      <DashboardPageHeader
        title={t('affiliates.settings.title')}
        description={t('affiliates.settings.description')}
        actions={
          canWrite ? (
            <Button type="submit" disabled={isSubmitting || !state.isDirty || !state.isValid}>
              {t('affiliates.settings.actions.save')}
            </Button>
          ) : undefined
        }
      />
      {!canWrite ? <p role="note">{t('affiliates.settings.readOnly')}</p> : null}
      <Fields settings={settings} pages={pages} disabled={!canWrite || isSubmitting} />
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setPending(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('affiliates.settings.disableTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('affiliates.settings.help.programEnabled')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>{t('affiliates.actions.cancel')}</AlertDialogCancel>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (pending) void save(pending.values, pending.methods)
              }}
            >
              {t('affiliates.settings.actions.save')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormWrapper>
  )
}
