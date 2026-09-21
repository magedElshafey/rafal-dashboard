import type { BaseSyntheticEvent } from 'react'
import { useMemo } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormInput, FormLocationMap, FormSelect, FormSortOrder } from '@/components/form'
import env from '@/config/env'
import { useRegions } from '@/modules/regions/hooks/useRegions'
import { createCitySchema } from '@/modules/cities/schemas/city.schema'
import type { CityFormValues, CityPayload } from '@/modules/cities/types/city.types'
import { getLocalizedName } from '@/modules/cities/utils/city.utils'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type CitySubmitIntent = 'create' | 'create-another' | 'edit'

export function createEmptyCityFormValues(): CityFormValues {
  return {
    regionId: null,
    name: { ar: '', en: '' },
    sortOrder: null,
    isActive: true,
    boundary: [],
    center: null,
  }
}

type Props = {
  formId: string
  initialValues: CityFormValues
  resetValuesKey: string | number
  isSubmitting: boolean
  onFormStateChange: (state: { isDirty: boolean; isValid: boolean }) => void
  onSubmit: (
    values: CityPayload,
    intent: CitySubmitIntent,
    methods: UseFormReturn<CityFormValues>
  ) => void | Promise<void>
}

function CityGeometryFields({ disabled, resetValuesKey }: { disabled: boolean; resetValuesKey: string | number }) {
  const { t } = useTranslation()

  return (
    <FormLocationMap
      key={resetValuesKey}
      resetValuesKey={resetValuesKey}
      disabled={disabled}
      styleUrl={env.MAP_STYLE_URL}
      mapLabels={{
        map: t('cities.geo.map'),
        mapLoading: t('cities.geo.mapLoading'),
        mapFailed: t('cities.geo.mapFailed'),
        retryMap: t('cities.geo.retryMap'),
        setCenter: t('cities.geo.setCenter'),
        changeCenter: t('cities.geo.changeCenter'),
        clearCenter: t('cities.geo.clearCenter'),
        drawBoundary: t('cities.geo.drawBoundary'),
        editBoundary: t('cities.geo.editBoundary'),
        redrawBoundary: t('cities.geo.redrawBoundary'),
        clearBoundary: t('cities.geo.clearBoundary'),
        fitCoverage: t('cities.geo.fitCoverage'),
        centerSelected: t('cities.geo.centerSelected'),
        noCenterSelected: t('cities.geo.noCenter'),
        boundaryDefined: (count) => t('cities.boundary.defined', { count }),
        noBoundaryDefined: t('cities.geo.noBoundaryDefined'),
        advancedCoordinates: t('cities.geo.advancedCoordinates'),
        advancedDescription: t('cities.geo.advancedDescription'),
      }}
      advancedLabels={{
        boundary: t('cities.geo.boundary'),
        boundaryDescription: t('cities.geo.boundaryDescription'),
        center: t('cities.geo.center'),
        centerDescription: t('cities.geo.centerDescription'),
        point: (index) => t('cities.geo.point', { index }),
        latitude: t('cities.geo.latitude'),
        longitude: t('cities.geo.longitude'),
        addPoint: t('cities.geo.addPoint'),
        removePoint: (index) => t('cities.geo.removePoint', { index }),
        movePointUp: (index) => t('cities.geo.movePointUp', { index }),
        movePointDown: (index) => t('cities.geo.movePointDown', { index }),
        clearBoundary: t('cities.geo.clearBoundary'),
        setCenter: t('cities.geo.setCenter'),
        clearCenter: t('cities.geo.clearCenter'),
        noBoundary: t('cities.geo.noBoundary'),
        noCenter: t('cities.geo.noCenter'),
      }}
    />
  )
}

export function CityForm({ formId, initialValues, resetValuesKey, isSubmitting, onFormStateChange, onSubmit }: Props) {
  const { t, i18n } = useTranslation()
  const regionsQuery = useRegions()
  const regions = useMemo(() => regionsQuery.data?.pages.flatMap((page) => page.items) ?? [], [regionsQuery.data])
  const regionOptions = useMemo(
    () => regions.map((region) => ({ value: region.id, label: getLocalizedName(region.name, i18n.language) })),
    [i18n.language, regions]
  )
  const schema = useMemo(
    () =>
      createCitySchema({
        regionRequired: t('cities.validation.regionRequired'),
        nameArRequired: t('cities.validation.nameArRequired'),
        nameEnRequired: t('cities.validation.nameEnRequired'),
        sortInteger: t('cities.validation.sortInteger'),
        coordinateNumber: t('cities.validation.coordinateRequired'),
        latitudeRange: t('cities.validation.latitudeRange'),
        longitudeRange: t('cities.validation.longitudeRange'),
        centerRequired: t('cities.validation.centerRequired'),
        boundaryRequired: t('cities.validation.boundaryRequired'),
        boundaryMinimum: t('cities.validation.boundaryMinimum'),
      }),
    [t]
  )
  const hasRegionError = regionsQuery.isError || regionsQuery.isFetchNextPageError

  const handleSubmit = async (
    values: CityFormValues,
    methods: UseFormReturn<CityFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
    const intent = (submitter?.dataset.submitIntent ?? 'create') as CitySubmitIntent
    try {
      await onSubmit(
        {
          ...values,
          name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
          boundary: values.boundary.map((point) => ({ ...point })),
          center: values.center ? { ...values.center } : null,
        },
        intent,
        methods
      )
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        region_id: 'regionId',
        'name.ar': 'name.ar',
        'name[ar]': 'name.ar',
        'name.en': 'name.en',
        'name[en]': 'name.en',
        sort_order: 'sortOrder',
        is_active: 'isActive',
        boundary: 'boundary',
        'boundary.*.lat': 'boundary',
        'boundary.*.lng': 'boundary',
        center: 'center',
        'center.lat': 'center',
        'center.lng': 'center',
        'center[lat]': 'center',
        'center[lng]': 'center',
      })
    }
  }

  return (
    <FormWrapper<CityFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={resetValuesKey}
      formId={formId}
      className="space-y-6"
      submissionDisabled={isSubmitting}
      validationMode="onChange"
      onFormStateChange={onFormStateChange}
      onSubmit={handleSubmit}
    >
      <section className="space-y-5 rounded-2xl border border-border bg-surface p-5" aria-labelledby="city-basic-title">
        <div>
          <h2 id="city-basic-title" className="font-semibold text-foreground">
            {t('cities.sections.basic')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('cities.sections.basicDescription')}</p>
        </div>
        <FormSelect
          name="regionId"
          label={t('cities.fields.region')}
          placeholder={t('cities.region.placeholder')}
          data={regionOptions}
          valueKey="value"
          labelKey="label"
          serializeValue={(value) => (value === null || value === undefined ? '' : String(value))}
          deserializeValue={(value) => (value === '' ? null : Number(value))}
          required
          disabled={isSubmitting}
          isLoading={regionsQuery.isLoading}
          isFetchingNextPage={regionsQuery.isFetchingNextPage}
          hasNextPage={regionsQuery.hasNextPage}
          onLoadMore={regionsQuery.fetchNextPage}
          isError={hasRegionError}
          isRetrying={regionsQuery.isFetching}
          onRetry={regionsQuery.isFetchNextPageError ? regionsQuery.fetchNextPage : () => regionsQuery.refetch()}
          emptyMessage={t('cities.region.empty')}
          loadingMessage={t('cities.region.loading')}
          loadMoreMessage={t('cities.region.loadMore')}
          errorMessage={t('cities.region.error')}
          retryLabel={t('cities.region.retry')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput name="name.ar" label={t('cities.fields.nameAr')} dir="rtl" required disabled={isSubmitting} />
          <FormInput name="name.en" label={t('cities.fields.nameEn')} dir="ltr" required disabled={isSubmitting} />
        </div>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <FormSortOrder name="sortOrder" label={t('cities.fields.sortOrder')} disabled={isSubmitting} />
          <div className="pt-8">
            <FormCheckbox name="isActive" label={t('cities.fields.active')} disabled={isSubmitting} />
          </div>
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="city-geography-title"
      >
        <div>
          <h2 id="city-geography-title" className="font-semibold text-foreground">
            {t('cities.sections.geography')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('cities.sections.geographyDescription')}</p>
        </div>
        <CityGeometryFields disabled={isSubmitting} resetValuesKey={resetValuesKey} />
      </section>
    </FormWrapper>
  )
}
