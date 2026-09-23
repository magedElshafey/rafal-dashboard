import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardCardActions } from '@/components/shared/dashboard/molecules/DashboardCardAction/DashboardCardAction'
import DeleteAlert, { type DeleteAlertRef } from '@/components/shared/DeleteAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductVariantDrawer } from '@/modules/products/components/ProductVariantDrawer'
import { ProductVariantStocks } from '@/modules/products/components/ProductVariantStocks'
import { useDeleteProductVariant } from '@/modules/products/hooks/useDeleteProductVariant'
import {
  useDeleteProductVariantMedia,
  type ProductVariantMediaTarget,
} from '@/modules/products/hooks/useDeleteProductVariantMedia'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { getVariantAttributesPresentation } from '@/modules/products/utils/product-variant.utils'
import { useWarehouses } from '@/modules/warehouses/hooks/useWarehouses'

type Props = { product: ProductDetail }

export function ProductVariantsSection({ product }: Props) {
  const { t, i18n } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null)
  const [mediaToDelete, setMediaToDelete] = useState<ProductVariantMediaTarget | null>(null)
  const variantAlertRef = useRef<DeleteAlertRef>(null)
  const mediaAlertRef = useRef<DeleteAlertRef>(null)
  const variantLockRef = useRef(false)
  const mediaLockRef = useRef(false)
  const deleteVariant = useDeleteProductVariant(product.id)
  const deleteMedia = useDeleteProductVariantMedia(product.id)
  const warehousesQuery = useWarehouses()
  const warehouses = useMemo(
    () => warehousesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [warehousesQuery.data]
  )
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language])
  const deletingMedia = deleteMedia.isPending ? (deleteMedia.variables ?? null) : null

  useEffect(() => {
    if (variantToDelete !== null) variantAlertRef.current?.handleOpen(true)
  }, [variantToDelete])
  useEffect(() => {
    if (mediaToDelete !== null) mediaAlertRef.current?.handleOpen(true)
  }, [mediaToDelete])

  const handleVariantDelete = async () => {
    if (variantToDelete === null || deleteVariant.isPending || variantLockRef.current) return
    variantLockRef.current = true
    try {
      await deleteVariant.mutateAsync(variantToDelete)
      variantAlertRef.current?.close()
      setVariantToDelete(null)
    } catch {
      // The mutation owns safe localized feedback and the confirmation remains available for retry.
    } finally {
      variantLockRef.current = false
    }
  }

  const handleMediaDelete = async () => {
    if (!mediaToDelete || deleteMedia.isPending || mediaLockRef.current) return
    mediaLockRef.current = true
    try {
      await deleteMedia.mutateAsync(mediaToDelete)
      mediaAlertRef.current?.close()
      setMediaToDelete(null)
    } catch {
      // The mutation owns safe localized feedback and the confirmation remains available for retry.
    } finally {
      mediaLockRef.current = false
    }
  }

  return (
    <section className="mt-8 space-y-4" aria-labelledby="product-variants-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="product-variants-title" className="text-xl font-semibold text-foreground">
            {t('products.variants.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('products.variants.description')}</p>
        </div>
        <Button type="button" onClick={() => setDrawerOpen(true)}>
          <Plus aria-hidden="true" />
          {t('products.variants.actions.add')}
        </Button>
      </div>

      {product.variants.length === 0 ? (
        <DashboardCard padding="lg">
          <p className="text-sm text-muted-foreground">{t('products.variants.empty')}</p>
        </DashboardCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {product.variants.map((variant) => {
            const attributes = getVariantAttributesPresentation(variant.attributes)
            return (
              <DashboardCard key={variant.id} className="space-y-4" padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground" dir="ltr">
                      {variant.sku}
                    </h3>
                    <Badge variant={variant.isActive ? 'success' : 'outline'}>
                      {t(variant.isActive ? 'products.status.active' : 'products.status.inactive')}
                    </Badge>
                  </div>
                  <DashboardCardActions
                    triggerMode="menu"
                    disabled={deleteVariant.isPending && deleteVariant.variables === variant.id}
                    triggerLabel={t('products.variants.actions.forVariant', { sku: variant.sku })}
                    actions={[
                      {
                        id: 'delete',
                        label: t('products.variants.actions.delete'),
                        accessibleLabel: t('products.variants.actions.deleteNamed', { sku: variant.sku }),
                        icon: Trash2,
                        variant: 'destructive',
                        onClick: () => setVariantToDelete(variant.id),
                      },
                    ]}
                  />
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">{t('products.variants.fields.attributes')}</dt>
                    <dd className="text-foreground">
                      {attributes.kind === 'flat'
                        ? attributes.entries.map(([key, value]) => `${key}: ${value}`).join(', ')
                        : t(
                            attributes.kind === 'empty'
                              ? 'products.variants.noAttributes'
                              : 'products.variants.complexAttributes'
                          )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t('products.variants.fields.priceOverride')}</dt>
                    <dd className="text-foreground">
                      {variant.priceOverride === null
                        ? t('products.variants.usesBasePrice')
                        : numberFormatter.format(variant.priceOverride)}
                    </dd>
                  </div>
                </dl>

                {variant.images.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3" aria-label={t('products.variants.existingImages')}>
                    {variant.images.map((image) => {
                      const isDeleting = deletingMedia?.variantId === variant.id && deletingMedia.mediaId === image.id
                      return (
                        <li key={image.id} className="overflow-hidden rounded-xl border border-border">
                          <img
                            src={image.url}
                            alt={t('products.variants.imageAlt', { sku: variant.sku, id: image.id })}
                            className="aspect-video size-full object-contain"
                          />
                          <div className="flex justify-end border-t border-border p-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={isDeleting}
                              aria-busy={isDeleting || undefined}
                              aria-label={t('products.variants.actions.deleteImageNamed', {
                                sku: variant.sku,
                                id: image.id,
                              })}
                              onClick={() => setMediaToDelete({ variantId: variant.id, mediaId: image.id })}
                            >
                              {isDeleting ? (
                                <LoaderCircle aria-hidden="true" className="animate-spin" />
                              ) : (
                                <Trash2 aria-hidden="true" />
                              )}
                              {isDeleting ? t('products.actions.deletingImage') : t('products.actions.deleteImage')}
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
                <ProductVariantStocks
                  productId={product.id}
                  variant={variant}
                  warehouses={warehouses}
                  isLoadingWarehouses={warehousesQuery.isLoading}
                  isFetchingWarehouses={warehousesQuery.isFetching}
                  isFetchingNextWarehousePage={warehousesQuery.isFetchingNextPage}
                  hasNextWarehousePage={Boolean(warehousesQuery.hasNextPage)}
                  hasWarehouseError={warehousesQuery.isError || warehousesQuery.isFetchNextPageError}
                  onLoadMoreWarehouses={warehousesQuery.fetchNextPage}
                  onRetryWarehouses={
                    warehousesQuery.isFetchNextPageError ? warehousesQuery.fetchNextPage : warehousesQuery.refetch
                  }
                />
              </DashboardCard>
            )
          })}
        </div>
      )}

      <ProductVariantDrawer productId={product.id} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <DeleteAlert
        ref={variantAlertRef}
        title={t('products.variants.delete.title')}
        body={t('products.variants.delete.description')}
        confirmLabel={t('products.variants.actions.delete')}
        cancelLabel={t('products.actions.cancel')}
        pendingLabel={t('products.variants.actions.deleting')}
        isPending={deleteVariant.isPending}
        onDelete={handleVariantDelete}
        onCancel={() => setVariantToDelete(null)}
      />
      <DeleteAlert
        ref={mediaAlertRef}
        title={t('products.variants.imageDelete.title')}
        body={t('products.variants.imageDelete.description')}
        confirmLabel={t('products.actions.deleteImage')}
        cancelLabel={t('products.actions.cancel')}
        pendingLabel={t('products.actions.deletingImage')}
        isPending={deleteMedia.isPending}
        onDelete={handleMediaDelete}
        onCancel={() => setMediaToDelete(null)}
      />
    </section>
  )
}
