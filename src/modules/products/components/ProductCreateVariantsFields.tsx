import { memo, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormCheckbox, FormInput, FormSelect } from '@/components/form'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Button } from '@/components/ui/button'
import type { ProductCreateFormValues } from '@/modules/products/types/product.types'
import { createEmptyProductStock, createEmptyProductVariant } from '@/modules/products/utils/product-create.utils'
import { isSixDigitHexColor, normalizeVariantAttributeKey } from '@/modules/products/utils/product-variant.utils'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'
import type { WarehouseListItem } from '@/modules/warehouses/types/warehouse.types'

type WarehouseQueryProps = {
  warehouses: WarehouseListItem[]
  isLoading: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  hasError: boolean
  loadMore: () => void | Promise<unknown>
  retry: () => void | Promise<unknown>
}

const StockRow = memo(function StockRow({
  variantIndex,
  stockIndex,
  onRemove,
  warehouseQuery,
}: {
  variantIndex: number
  stockIndex: number
  onRemove: () => void
  warehouseQuery: WarehouseQueryProps
}) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const stocks = useWatch({ control, name: `variants.${variantIndex}.stocks` })
  const currentWarehouseId = stocks[stockIndex]?.warehouseId ?? null
  const unavailableIds = new Set(
    stocks
      .filter((_, index) => index !== stockIndex)
      .map((stock) => stock.warehouseId)
      .filter((id): id is number => id !== null)
  )
  const availableWarehouses = warehouseQuery.warehouses.filter(
    (warehouse) => warehouse.id === currentWarehouseId || !unavailableIds.has(warehouse.id)
  )
  const selectQueryProps = {
    isLoading: warehouseQuery.isLoading,
    isFetchingNextPage: warehouseQuery.isFetchingNextPage,
    hasNextPage: warehouseQuery.hasNextPage,
    onLoadMore: warehouseQuery.loadMore,
    isError: warehouseQuery.hasError,
    isRetrying: warehouseQuery.isFetching,
    onRetry: warehouseQuery.retry,
  }

  return (
    <div className="grid items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
      <FormSelect
        {...selectQueryProps}
        name={`variants.${variantIndex}.stocks.${stockIndex}.warehouseId`}
        label={t('products.variants.stock.fields.warehouse')}
        placeholder={t('products.variants.stock.selectWarehouse')}
        data={availableWarehouses}
        valueKey="id"
        labelKey="name"
        deserializeValue={(value) => (value ? Number(value) : null)}
        required
      />
      <FormInput
        name={`variants.${variantIndex}.stocks.${stockIndex}.quantity`}
        label={t('products.variants.stock.fields.quantity')}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        dir="ltr"
        required
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="mt-7 text-destructive"
        aria-label={t('products.create.aggregate.removeStock', { index: stockIndex + 1 })}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
})

function VariantStocksEditor({
  variantIndex,
  warehouseQuery,
}: {
  variantIndex: number
  warehouseQuery: WarehouseQueryProps
}) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: `variants.${variantIndex}.stocks` })
  const { errors } = useFormState({ control, name: `variants.${variantIndex}.stocks` })
  const error = errors.variants?.[variantIndex]?.stocks as { message?: string } | undefined

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground">{t('products.variants.stock.title')}</legend>
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('products.variants.stock.empty')}</p>
      ) : null}
      {fields.map((field, stockIndex) => (
        <StockRow
          key={field.id}
          variantIndex={variantIndex}
          stockIndex={stockIndex}
          onRemove={() => remove(stockIndex)}
          warehouseQuery={warehouseQuery}
        />
      ))}
      {error?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <Button type="button" variant="outline" onClick={() => append(createEmptyProductStock())}>
        <Plus aria-hidden="true" />
        {t('products.variants.stock.actions.add')}
      </Button>
    </fieldset>
  )
}

const AttributeRow = memo(function AttributeRow({
  variantIndex,
  attributeIndex,
  onRemove,
}: {
  variantIndex: number
  attributeIndex: number
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const key = useWatch({ control, name: `variants.${variantIndex}.attributes.${attributeIndex}.key` }) ?? ''
  const value = useWatch({ control, name: `variants.${variantIndex}.attributes.${attributeIndex}.value` }) ?? ''
  const usesColorPicker = normalizeVariantAttributeKey(key) === 'color' && (!value || isSixDigitHexColor(value))

  return (
    <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <FormInput
        name={`variants.${variantIndex}.attributes.${attributeIndex}.key`}
        label={t('products.variants.fields.attributeKey')}
      />
      <div className="space-y-2">
        <FormInput
          name={`variants.${variantIndex}.attributes.${attributeIndex}.value`}
          label={t('products.variants.fields.attributeValue')}
          type={usesColorPicker ? 'color' : 'text'}
          dir="ltr"
        />
        {usesColorPicker && value ? (
          <output className="block font-mono text-xs text-muted-foreground">{value.toUpperCase()}</output>
        ) : null}
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="mt-7 text-destructive"
        aria-label={t('products.variants.actions.removeAttribute', { index: attributeIndex + 1 })}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
})

function VariantAttributesEditor({ variantIndex }: { variantIndex: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: `variants.${variantIndex}.attributes` })
  const { errors } = useFormState({ control, name: `variants.${variantIndex}.attributes` })
  const error = errors.variants?.[variantIndex]?.attributes as { message?: string } | undefined

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground">{t('products.variants.fields.attributes')}</legend>
      {fields.map((field, attributeIndex) => (
        <AttributeRow
          key={field.id}
          variantIndex={variantIndex}
          attributeIndex={attributeIndex}
          onRemove={() => remove(attributeIndex)}
        />
      ))}
      {error?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <Button type="button" variant="outline" onClick={() => append({ key: '', value: '' })}>
        <Plus aria-hidden="true" />
        {t('products.variants.actions.addAttribute')}
      </Button>
    </fieldset>
  )
}

const VariantEditor = memo(function VariantEditor({
  variantIndex,
  onRemove,
  warehouseQuery,
}: {
  variantIndex: number
  onRemove: () => void
  warehouseQuery: WarehouseQueryProps
}) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const sku = useWatch({ control, name: `variants.${variantIndex}.sku` })

  return (
    <DashboardCard className="space-y-6" padding="lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {t('products.create.aggregate.variantHeading', { index: variantIndex + 1 })}
          </h3>
          {sku.trim() ? (
            <p className="text-sm text-muted-foreground" dir="ltr">
              {sku}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" className="text-destructive" onClick={onRemove}>
          <Trash2 aria-hidden="true" />
          {t('products.create.aggregate.removeVariant')}
        </Button>
      </div>
      <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <FormInput
          name={`variants.${variantIndex}.sku`}
          label={t('products.variants.fields.sku')}
          dir="ltr"
          maxLength={255}
          required
        />
        <FormInput
          name={`variants.${variantIndex}.priceOverride`}
          label={t('products.variants.fields.priceOverride')}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          dir="ltr"
          placeholder={t('products.variants.usesBasePrice')}
        />
        <div className="pt-8">
          <FormCheckbox name={`variants.${variantIndex}.isActive`} label={t('products.variants.fields.active')} />
        </div>
      </div>
      <VariantAttributesEditor variantIndex={variantIndex} />
      <VariantStocksEditor variantIndex={variantIndex} warehouseQuery={warehouseQuery} />
    </DashboardCard>
  )
})

export function ProductCreateVariantsFields() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductCreateFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const { errors } = useFormState({ control, name: 'variants' })
  const variantsError = errors.variants as { message?: string } | undefined
  const query = useWarehouses()
  const warehouses = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  const warehouseQuery = useMemo<WarehouseQueryProps>(
    () => ({
      warehouses,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: Boolean(query.hasNextPage),
      hasError: query.isError || query.isFetchNextPageError,
      loadMore: query.fetchNextPage,
      retry: query.isFetchNextPageError ? query.fetchNextPage : query.refetch,
    }),
    [
      warehouses,
      query.isLoading,
      query.isFetching,
      query.isFetchingNextPage,
      query.hasNextPage,
      query.isError,
      query.isFetchNextPageError,
      query.fetchNextPage,
      query.refetch,
    ]
  )

  return (
    <section className="space-y-4" aria-labelledby="product-create-variants-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="product-create-variants-title" className="text-lg font-semibold text-foreground">
            {t('products.create.aggregate.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('products.create.aggregate.description')}</p>
        </div>
        <Button type="button" onClick={() => append(createEmptyProductVariant())}>
          <Plus aria-hidden="true" />
          {t('products.variants.actions.add')}
        </Button>
      </div>
      {fields.length === 0 ? <p className="text-sm text-muted-foreground">{t('products.variants.empty')}</p> : null}
      {fields.map((field, variantIndex) => (
        <VariantEditor
          key={field.id}
          variantIndex={variantIndex}
          onRemove={() => remove(variantIndex)}
          warehouseQuery={warehouseQuery}
        />
      ))}
      {variantsError?.message ? (
        <p role="alert" className="text-sm text-destructive">
          {variantsError.message}
        </p>
      ) : null}
    </section>
  )
}
