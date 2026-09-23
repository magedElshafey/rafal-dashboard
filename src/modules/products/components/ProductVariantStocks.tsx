import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { Button } from '@/components/ui/button'
import {
  ProductVariantStockDrawer,
  type ProductVariantStockDrawerState,
} from '@/modules/products/components/ProductVariantStockDrawer'
import { useDeleteProductVariantStock } from '@/modules/products/hooks/useDeleteProductVariantStock'
import type { ProductVariant } from '@/modules/products/types/product-variant.types'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'

type Props = {
  productId: number
  variant: ProductVariant
  warehouses: Warehouse[]
  isLoadingWarehouses: boolean
  isFetchingWarehouses: boolean
  isFetchingNextWarehousePage: boolean
  hasNextWarehousePage: boolean
  hasWarehouseError: boolean
  onLoadMoreWarehouses: () => void | Promise<unknown>
  onRetryWarehouses: () => void | Promise<unknown>
}

export function ProductVariantStocks({
  productId,
  variant,
  warehouses,
  isLoadingWarehouses,
  isFetchingWarehouses,
  isFetchingNextWarehousePage,
  hasNextWarehousePage,
  hasWarehouseError,
  onLoadMoreWarehouses,
  onRetryWarehouses,
}: Props) {
  const { t } = useTranslation()
  const [drawerState, setDrawerState] = useState<ProductVariantStockDrawerState | null>(null)
  const [warehouseToDelete, setWarehouseToDelete] = useState<number | null>(null)
  const alertRef = useRef<DeleteAlertRef>(null)
  const lockRef = useRef(false)
  const deleteStock = useDeleteProductVariantStock(productId)

  useEffect(() => {
    if (warehouseToDelete !== null) alertRef.current?.handleOpen(true)
  }, [warehouseToDelete])

  const warehouseNames = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]))
  const warehouseLabel = (warehouseId: number) =>
    warehouseNames.get(warehouseId) ?? t('products.variants.stock.warehouseFallback', { id: warehouseId })

  const handleDelete = async () => {
    if (warehouseToDelete === null || deleteStock.isPending || lockRef.current) return
    lockRef.current = true
    try {
      await deleteStock.mutateAsync({ variantId: variant.id, warehouseId: warehouseToDelete })
      alertRef.current?.close()
      setWarehouseToDelete(null)
    } catch {
      // The mutation owns safe localized feedback and the confirmation remains available for retry.
    } finally {
      lockRef.current = false
    }
  }

  return (
    <section className="space-y-3" aria-labelledby={`variant-${variant.id}-stock-title`}>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <h4 id={`variant-${variant.id}-stock-title`} className="font-medium text-foreground">
          {t('products.variants.stock.title')}
        </h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setDrawerState({ mode: 'create', variantId: variant.id })}
        >
          <Plus aria-hidden="true" />
          {t('products.variants.stock.actions.add')}
        </Button>
      </div>

      {variant.warehouseStocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('products.variants.stock.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-start text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-start font-medium">
                  {t('products.variants.stock.fields.warehouse')}
                </th>
                <th scope="col" className="px-3 py-2 text-start font-medium">
                  {t('products.variants.stock.fields.quantity')}
                </th>
                <th scope="col" className="px-3 py-2 text-end font-medium">
                  <span className="sr-only">{t('products.actions.label')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variant.warehouseStocks.map((stock) => {
                const label = warehouseLabel(stock.warehouseId)
                const isDeleting = deleteStock.isPending && deleteStock.variables?.warehouseId === stock.warehouseId
                return (
                  <tr key={stock.warehouseId} className="border-t border-border">
                    <td className="px-3 py-2">{label}</td>
                    <td className="px-3 py-2" dir="ltr">
                      {stock.quantity}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={isDeleting}
                          aria-label={t('products.variants.stock.actions.editNamed', { warehouse: label })}
                          onClick={() => setDrawerState({ mode: 'edit', variantId: variant.id, stock })}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={isDeleting}
                          aria-label={t('products.variants.stock.actions.removeNamed', { warehouse: label })}
                          onClick={() => setWarehouseToDelete(stock.warehouseId)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductVariantStockDrawer
        productId={productId}
        state={drawerState}
        onOpenChange={(open) => {
          if (!open) setDrawerState(null)
        }}
        warehouses={warehouses}
        assignedWarehouseIds={variant.warehouseStocks.map((stock) => stock.warehouseId)}
        isLoadingWarehouses={isLoadingWarehouses}
        isFetchingWarehouses={isFetchingWarehouses}
        isFetchingNextWarehousePage={isFetchingNextWarehousePage}
        hasNextWarehousePage={hasNextWarehousePage}
        hasWarehouseError={hasWarehouseError}
        onLoadMoreWarehouses={onLoadMoreWarehouses}
        onRetryWarehouses={onRetryWarehouses}
      />
      <DeleteAlert
        ref={alertRef}
        title={t('products.variants.stock.delete.title')}
        body={t('products.variants.stock.delete.description', {
          warehouse: warehouseToDelete === null ? '' : warehouseLabel(warehouseToDelete),
        })}
        confirmLabel={t('products.variants.stock.actions.remove')}
        cancelLabel={t('products.actions.cancel')}
        pendingLabel={t('products.variants.stock.actions.removing')}
        isPending={deleteStock.isPending}
        onDelete={handleDelete}
        onCancel={() => setWarehouseToDelete(null)}
      />
    </section>
  )
}
