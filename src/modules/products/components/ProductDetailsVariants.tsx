import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Routes } from '@/routes/routes'
import { Button } from '@/components/ui/button'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductDetailsSection } from '@/modules/products/components/ProductDetailsSection'
import { ProductImage } from '@/modules/products/components/ProductImage'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { humanizeVariantAttributeKey } from '@/modules/products/utils/product-variant.utils'
import { resolveAppLocale } from '@/utils/date/date.helpers'

export function ProductDetailsVariants({ product }: { product?: ProductDetail }) {
  const { t, i18n } = useTranslation()
  const [search] = useSearchParams()
  const selectedVariant = product?.variants.find((variant) => String(variant.id) === search.get('variant'))
  const selectedStock = selectedVariant?.warehouseStocks.find(
    (stock) => String(stock.warehouseId) === search.get('warehouse')
  )
  const numbers = new Intl.NumberFormat(resolveAppLocale(i18n.language), { maximumFractionDigits: 20 })
  const variants = product ? product.variants : [null, null]
  const stocks = product
    ? product.variants.flatMap((variant) =>
        variant.warehouseStocks.map((stock) => ({
          ...stock,
          variantId: variant.id,
          sku: variant.sku,
        }))
      )
    : [null, null]
  const columns = [
    { id: 'sku', header: t('products.variants.fields.sku') },
    { id: 'warehouse', header: t('products.variants.stock.fields.warehouse') },
    { id: 'quantity', header: t('products.variants.stock.fields.quantity') },
  ]

  return (
    <>
      {selectedStock ? (
        <Button asChild variant="outline">
          <Link to={Routes.warehouseInventoryPath(selectedStock.warehouseId)}>{t('inventory.warehouseAction')}</Link>
        </Button>
      ) : null}
      <ProductDetailsSection title={t('products.variants.title')}>
        <div className="min-h-44">
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('products.variants.empty')}</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {variants.map((variant, index) => (
                <article
                  key={variant?.id ?? index}
                  id={variant ? `variant-${variant.id}` : undefined}
                  className="min-w-0 space-y-4 rounded-lg border border-border p-4"
                >
                  {variant && variant.id === selectedVariant?.id ? (
                    <Badge variant="secondary">{t('inventory.selectedVariant')}</Badge>
                  ) : null}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="min-w-0 break-all font-semibold">
                      {variant ? <bdi dir="ltr">{variant.sku || '—'}</bdi> : <Skeleton className="h-6 w-32" />}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {variant ? (
                        <>
                          <Badge variant={variant.isActive ? 'success' : 'outline'}>
                            {t(variant.isActive ? 'products.status.active' : 'products.status.inactive')}
                          </Badge>
                          {variant.isDefault ? (
                            <Badge variant="secondary">{t('products.variants.default')}</Badge>
                          ) : null}
                        </>
                      ) : (
                        <Skeleton className="h-6 w-20" />
                      )}
                    </div>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <ResponsiveDataFact label={t('products.variants.fields.priceOverride')}>
                      {variant ? (
                        variant.priceOverride === null ? (
                          t('products.variants.usesBasePrice')
                        ) : (
                          numbers.format(variant.priceOverride)
                        )
                      ) : (
                        <Skeleton className="h-5 w-24" />
                      )}
                    </ResponsiveDataFact>
                    <ResponsiveDataFact label={t('products.variants.fields.attributes')}>
                      {variant ? (
                        Object.keys(variant.attributes).length ? (
                          <ul className="space-y-1">
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <li key={key}>
                                <bdi>{humanizeVariantAttributeKey(key)}</bdi>: <bdi>{value}</bdi>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          t('products.variants.noAttributes')
                        )
                      ) : (
                        <Skeleton className="h-5 w-32 max-w-full" />
                      )}
                    </ResponsiveDataFact>
                  </dl>
                  {variant?.images.length ? (
                    <ul className="grid grid-cols-4 gap-2" aria-label={t('products.variants.fields.images')}>
                      {variant.images.map((image) => (
                        <li key={image.id}>
                          <ProductImage
                            url={image.url}
                            name={`${product ? getLocalizedProductName(product.name, i18n.language) : ''} — ${variant.sku}`}
                            className="h-auto w-full object-contain"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </ProductDetailsSection>
      <ProductDetailsSection title={t('products.details.inventory')}>
        <div className="min-h-44">
          {stocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('products.variants.stock.empty')}</p>
          ) : (
            <>
              <ResponsiveDataDesktop>
                <ResponsiveDataTable columns={columns} aria-label={t('products.details.inventory')}>
                  {stocks.map((stock, index) => (
                    <ResponsiveDataTableRow key={stock ? `${stock.variantId}-${stock.warehouseId}` : index}>
                      <ResponsiveDataTableCell className="max-w-64 whitespace-normal break-all">
                        {stock ? <bdi dir="ltr">{stock.sku || '—'}</bdi> : <Skeleton className="h-5 w-32" />}
                      </ResponsiveDataTableCell>
                      <ResponsiveDataTableCell>
                        {stock ? (
                          t('products.variants.stock.warehouseFallback', { id: numbers.format(stock.warehouseId) })
                        ) : (
                          <Skeleton className="h-5 w-32" />
                        )}
                      </ResponsiveDataTableCell>
                      <ResponsiveDataTableCell>
                        {stock ? numbers.format(stock.quantity) : <Skeleton className="h-5 w-16" />}
                        {stock &&
                        stock.variantId === selectedVariant?.id &&
                        stock.warehouseId === selectedStock?.warehouseId ? (
                          <Badge className="ms-2" variant="secondary">
                            {t('inventory.selectedStock')}
                          </Badge>
                        ) : null}
                      </ResponsiveDataTableCell>
                    </ResponsiveDataTableRow>
                  ))}
                </ResponsiveDataTable>
              </ResponsiveDataDesktop>
              <ResponsiveDataMobileCards className="p-0">
                {stocks.map((stock, index) => (
                  <ResponsiveDataMobileCard
                    key={stock ? `${stock.variantId}-${stock.warehouseId}` : index}
                    title={
                      stock ? (
                        <bdi dir="ltr" className="break-all">
                          {stock.sku || '—'}
                        </bdi>
                      ) : (
                        <Skeleton className="h-6 w-32" />
                      )
                    }
                    facts={
                      <>
                        <ResponsiveDataFact label={t('products.variants.stock.fields.warehouse')}>
                          {stock ? (
                            t('products.variants.stock.warehouseFallback', { id: numbers.format(stock.warehouseId) })
                          ) : (
                            <Skeleton className="h-5 w-32" />
                          )}
                        </ResponsiveDataFact>
                        <ResponsiveDataFact label={t('products.variants.stock.fields.quantity')}>
                          {stock ? numbers.format(stock.quantity) : <Skeleton className="h-5 w-16" />}
                          {stock &&
                          stock.variantId === selectedVariant?.id &&
                          stock.warehouseId === selectedStock?.warehouseId ? (
                            <Badge className="ms-2" variant="secondary">
                              {t('inventory.selectedStock')}
                            </Badge>
                          ) : null}
                        </ResponsiveDataFact>
                      </>
                    }
                  />
                ))}
              </ResponsiveDataMobileCards>
            </>
          )}
        </div>
      </ProductDetailsSection>
    </>
  )
}
