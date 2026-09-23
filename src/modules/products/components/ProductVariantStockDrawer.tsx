import { useMemo, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput, FormSelect } from '@/components/form'
import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { usePutProductVariantStock } from '@/modules/products/hooks/usePutProductVariantStock'
import { createProductVariantStockSchema } from '@/modules/products/schemas/product-variant-stock.schema'
import type {
  VariantWarehouseStock,
  VariantWarehouseStockFormValues,
} from '@/modules/products/types/product-variant.types'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

const FORM_ID = 'product-variant-stock-form'

export type ProductVariantStockDrawerState =
  { mode: 'create'; variantId: number } | { mode: 'edit'; variantId: number; stock: VariantWarehouseStock }

type Props = {
  productId: number
  state: ProductVariantStockDrawerState | null
  onOpenChange: (open: boolean) => void
  warehouses: Warehouse[]
  assignedWarehouseIds: number[]
  isLoadingWarehouses: boolean
  isFetchingWarehouses: boolean
  isFetchingNextWarehousePage: boolean
  hasNextWarehousePage: boolean
  hasWarehouseError: boolean
  onLoadMoreWarehouses: () => void | Promise<unknown>
  onRetryWarehouses: () => void | Promise<unknown>
}

export function ProductVariantStockDrawer({
  productId,
  state,
  onOpenChange,
  warehouses,
  assignedWarehouseIds,
  isLoadingWarehouses,
  isFetchingWarehouses,
  isFetchingNextWarehousePage,
  hasNextWarehousePage,
  hasWarehouseError,
  onLoadMoreWarehouses,
  onRetryWarehouses,
}: Props) {
  const { t } = useTranslation()
  const putStock = usePutProductVariantStock(productId)
  const lockRef = useRef(false)
  const mode = state?.mode ?? 'create'
  const editWarehouseId = state?.mode === 'edit' ? state.stock.warehouseId : null
  const availableWarehouses = warehouses.filter(
    (warehouse) => !assignedWarehouseIds.includes(warehouse.id) || warehouse.id === editWarehouseId
  )
  const resetValues = useMemo<VariantWarehouseStockFormValues>(
    () => ({
      warehouseId: editWarehouseId,
      quantity: state?.mode === 'edit' ? state.stock.quantity : null,
    }),
    [editWarehouseId, state]
  )
  const schema = useMemo(
    () =>
      createProductVariantStockSchema({
        required: t('products.validation.required'),
        validNumber: t('products.validation.validNumber'),
        integer: t('products.validation.integer'),
        nonNegative: t('products.validation.nonNegative'),
      }),
    [t]
  )

  const handleSubmit = async (
    values: VariantWarehouseStockFormValues,
    methods: UseFormReturn<VariantWarehouseStockFormValues>
  ) => {
    if (!state || values.warehouseId === null || values.quantity === null || lockRef.current) return
    lockRef.current = true
    try {
      await putStock.mutateAsync({
        variantId: state.variantId,
        warehouseId: values.warehouseId,
        quantity: values.quantity,
      })
      methods.reset(values)
      onOpenChange(false)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        warehouse_id: 'warehouseId',
        quantity: 'quantity',
      })
    } finally {
      lockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={state !== null}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{
        create: t('products.variants.stock.addTitle'),
        edit: t('products.variants.stock.editTitle'),
      }}
      descriptions={{
        create: t('products.variants.stock.addDescription'),
        edit: t('products.variants.stock.editDescription'),
      }}
      submitLabels={{
        create: t('products.variants.stock.actions.save'),
        edit: t('products.variants.stock.actions.save'),
      }}
      cancelLabel={t('products.actions.cancel')}
      closeLabel={t('products.variants.stock.actions.close')}
      formId={FORM_ID}
      isSubmitting={putStock.isPending}
    >
      <FormWrapper<VariantWarehouseStockFormValues>
        key={`${mode}-${state?.variantId ?? 'closed'}-${editWarehouseId ?? 'new'}`}
        schema={schema}
        defaultValues={resetValues}
        formId={FORM_ID}
        submissionDisabled={putStock.isPending}
        className="space-y-5"
        onSubmit={handleSubmit}
      >
        <FormSelect
          name="warehouseId"
          label={t('products.variants.stock.fields.warehouse')}
          placeholder={t('products.variants.stock.selectWarehouse')}
          data={availableWarehouses}
          valueKey="id"
          labelKey="name"
          deserializeValue={(value) => (value ? Number(value) : null)}
          disabled={putStock.isPending || mode === 'edit'}
          isLoading={isLoadingWarehouses}
          isFetchingNextPage={isFetchingNextWarehousePage}
          hasNextPage={hasNextWarehousePage}
          onLoadMore={onLoadMoreWarehouses}
          isError={hasWarehouseError}
          isRetrying={isFetchingWarehouses}
          onRetry={onRetryWarehouses}
          emptyMessage={t('products.variants.stock.noWarehouses')}
          loadingMessage={t('products.variants.stock.loadingWarehouses')}
          loadMoreMessage={t('products.variants.stock.loadMoreWarehouses')}
          errorMessage={t('products.variants.stock.warehouseError')}
          retryLabel={t('products.create.category.retry')}
          required
        />
        <FormInput
          name="quantity"
          label={t('products.variants.stock.fields.quantity')}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          dir="ltr"
          disabled={putStock.isPending}
          required
          autoFocus={mode === 'edit'}
        />
      </FormWrapper>
    </EntityFormDrawer>
  )
}
