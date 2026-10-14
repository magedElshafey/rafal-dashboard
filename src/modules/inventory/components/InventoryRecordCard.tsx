import { ClipboardCheck, ExternalLink, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { InventoryStock } from '@/modules/inventory/types/inventory.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { Routes } from '@/routes/routes'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

const linkClass =
  'rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring break-all'

export function InventoryRecordCard({
  stock,
  onStocktake,
}: {
  stock: InventoryStock | null
  onStocktake?: (stock: InventoryStock) => void
}) {
  const { t, i18n } = useTranslation()
  const name = stock ? getLocalizedProductName(stock.product.name, i18n.language) : ''
  const status = stock?.stockStatus
  const statusLabel =
    status === 'in_stock'
      ? t('inventory.status.inStock')
      : status === 'low_stock'
        ? t('inventory.status.lowStock')
        : status === 'out_of_stock'
          ? t('inventory.status.outOfStock')
          : status
  const titleId = stock ? `inventory-stock-${stock.id}` : undefined
  return (
    <article aria-labelledby={titleId} data-stock-id={stock?.id}>
      <DashboardCard padding="none" className="overflow-hidden bg-surface">
        <div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-start gap-2">
              {stock ? (
                <h3 id={titleId} className="min-w-0 flex-1 break-words text-base font-semibold leading-6">
                  <Link className={linkClass} to={Routes.productDetailPath(stock.product.id)}>
                    <bdi>{name}</bdi>
                  </Link>
                </h3>
              ) : (
                <Skeleton className="h-6 w-56 max-w-full" />
              )}
              {stock?.variant.isDefault ? <Badge variant="secondary">{t('products.variants.default')}</Badge> : null}
              {stock && (!stock.product.isActive || !stock.variant.isActive) ? (
                <Badge variant="outline">{t('inventory.inactive')}</Badge>
              ) : null}
            </div>
            <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
              {(['productSku', 'variantSku'] as const).map((field) => (
                <div key={field} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{t(`inventory.fields.${field}`)}</dt>
                  <dd className="mt-1 break-all text-sm font-medium">
                    {stock ? (
                      <bdi dir="ltr">{field === 'productSku' ? stock.product.sku : stock.variant.sku}</bdi>
                    ) : (
                      <Skeleton className="h-5 w-28" />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {stock ? (
              Object.keys(stock.variant.attributes).length ? (
                <ul aria-label={t('inventory.fields.attributes')} className="flex flex-wrap gap-1.5">
                  {Object.entries(stock.variant.attributes).map(([key, value]) => (
                    <li key={key} className="max-w-full rounded-md bg-muted px-2 py-1 text-xs leading-5 break-all">
                      <bdi className="text-muted-foreground">{key}</bdi>: <bdi className="font-medium">{value}</bdi>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">{t('products.variants.noAttributes')}</p>
              )
            ) : (
              <Skeleton className="h-7 w-40 max-w-full" />
            )}
          </div>
          <div className="min-w-0 space-y-2 border-t border-border pt-4 lg:border-s lg:border-t-0 lg:ps-5 lg:pt-0">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Warehouse className="size-4 shrink-0" aria-hidden />
              {t('inventory.fields.warehouse')}
            </p>
            {stock ? (
              <Link
                className={`${linkClass} block text-sm font-medium`}
                to={Routes.warehouseInventoryPath(stock.warehouse.id)}
              >
                <bdi>{stock.warehouse.name}</bdi>
              </Link>
            ) : (
              <Skeleton className="h-5 w-32 max-w-full" />
            )}
          </div>
          <div className="min-w-0 rounded-lg bg-muted/50 p-3 lg:bg-transparent lg:p-0 lg:ps-5 lg:border-s lg:border-border">
            <p className="text-xs text-muted-foreground">{t('inventory.fields.quantity')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 lg:items-start lg:flex-col">
              <div className="text-3xl font-semibold tabular-nums leading-none">
                {stock ? (
                  new Intl.NumberFormat(resolveAppLocale(i18n.language), { maximumFractionDigits: 20 }).format(
                    stock.quantity
                  )
                ) : (
                  <Skeleton className="h-8 w-20" />
                )}
              </div>
              {stock ? (
                <Badge
                  variant={
                    status === 'in_stock'
                      ? 'success'
                      : status === 'low_stock'
                        ? 'warning'
                        : status === 'out_of_stock'
                          ? 'destructive'
                          : 'outline'
                  }
                  className="max-w-full whitespace-normal break-all"
                >
                  <bdi>{statusLabel}</bdi>
                </Badge>
              ) : (
                <Skeleton className="h-6 w-24" />
              )}
            </div>
          </div>
        </div>
        <footer className="flex flex-col gap-3 border-t border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 text-xs text-muted-foreground">
            <p>{t('inventory.fields.updatedAt')}</p>
            {stock ? (
              <time dateTime={stock.updatedAt} className="mt-1 block">
                <bdi>{formatDateTime(stock.updatedAt, { locale: resolveAppLocale(i18n.language) })}</bdi>
              </time>
            ) : (
              <Skeleton className="mt-1 h-4 w-36" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stock ? (
              <>
                <Button asChild variant="outline" size="sm" className="h-10 flex-1 sm:flex-none">
                  <Link
                    aria-label={t('inventory.viewVariant', { sku: stock.variant.sku, warehouse: stock.warehouse.name })}
                    to={`${Routes.productDetailPath(stock.product.id)}?variant=${stock.variant.id}&warehouse=${stock.warehouse.id}#variant-${stock.variant.id}`}
                  >
                    <ExternalLink aria-hidden />
                    {t('inventory.openProduct')}
                  </Link>
                </Button>
                {onStocktake ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 flex-1 sm:flex-none"
                    aria-label={t('inventory.stocktake.named', {
                      sku: stock.variant.sku,
                      warehouse: stock.warehouse.name,
                    })}
                    onClick={() => onStocktake(stock)}
                  >
                    <ClipboardCheck aria-hidden />
                    {t('inventory.stocktake.title')}
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
              </>
            )}
          </div>
        </footer>
      </DashboardCard>
    </article>
  )
}
