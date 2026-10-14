import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProductImage } from '@/modules/products/components/ProductImage'
import { ProductActions } from '@/modules/products/components/ProductActions'
import type { ProductListItem } from '@/modules/products/types/product.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'

type Props = {
  products: readonly ProductListItem[]
  onEdit: (product: ProductListItem) => void
  onDelete: (product: ProductListItem) => void
  actionsDisabled?: boolean
}

export function ProductsList({ products, onEdit, onDelete, actionsDisabled = false }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }), [locale])
  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 20 }),
    [locale]
  )
  const columns = [
    { id: 'product', header: t('products.fields.product'), className: 'w-80' },
    { id: 'sku', header: t('products.fields.sku'), className: 'w-48' },
    { id: 'basePrice', header: t('products.fields.basePrice'), className: 'w-36 text-end' },
    { id: 'discount', header: t('products.fields.discount'), className: 'w-28 text-end' },
    { id: 'variants', header: t('products.fields.variants'), className: 'w-32 text-end' },
    { id: 'newArrival', header: t('products.fields.newArrival'), className: 'w-36' },
    { id: 'status', header: t('products.fields.status'), className: 'w-32' },
    { id: 'sortOrder', header: t('products.fields.sortOrder'), className: 'w-28 text-end' },
    { id: 'actions', header: t('products.actions.label'), className: 'w-20' },
  ]

  const discount = (product: ProductListItem) =>
    product.discountPercentage === null ? '—' : percentFormatter.format(product.discountPercentage / 100)
  const variants = (product: ProductListItem) =>
    t('products.variantCount', { count: product.variantCount, value: numberFormatter.format(product.variantCount) })
  const newArrival = (product: ProductListItem) =>
    product.isNewArrival ? <Badge variant="secondary">{t('products.flags.newArrival')}</Badge> : '—'
  const status = (product: ProductListItem) => (
    <Badge variant={product.isActive ? 'success' : 'outline'}>
      {t(product.isActive ? 'products.status.active' : 'products.status.inactive')}
    </Badge>
  )

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable
          columns={columns}
          // 20rem product + 12rem SKU + 53rem for numeric, badge and action columns.
          // Fixed layout keeps later infinite-scroll pages from resizing earlier rows.
          className="min-w-[85rem] table-fixed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          headerRowClassName="[&>th]:whitespace-normal"
          aria-label={t('products.listTitle')}
          tabIndex={0}
        >
          {products.map((product) => {
            const name = getLocalizedProductName(product.name, i18n.language)
            return (
              <ResponsiveDataTableRow key={product.id}>
                <ResponsiveDataTableCell className="whitespace-normal">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductImage url={product.images[0]?.url ?? null} name={name} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <bdi
                          dir="auto"
                          tabIndex={0}
                          className="line-clamp-2 min-w-0 break-all font-medium text-content-primary rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {name}
                        </bdi>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-normal break-all">
                        <bdi dir="auto">{name}</bdi>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <bdi
                        dir="ltr"
                        tabIndex={0}
                        className="block truncate font-mono text-xs rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {product.sku}
                      </bdi>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs whitespace-normal break-all">
                      <bdi dir="ltr">{product.sku}</bdi>
                    </TooltipContent>
                  </Tooltip>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="whitespace-normal break-all text-end tabular-nums">
                  {numberFormatter.format(product.basePrice)}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="whitespace-normal break-all text-end tabular-nums">
                  {discount(product)}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="whitespace-normal break-all text-end tabular-nums">
                  {variants(product)}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{newArrival(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="whitespace-normal break-all text-end tabular-nums">
                  {numberFormatter.format(product.sortOrder)}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <ProductActions
                    product={product}
                    displayName={name}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={actionsDisabled}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {products.map((product) => {
          const name = getLocalizedProductName(product.name, i18n.language)
          return (
            <ResponsiveDataMobileCard
              key={product.id}
              title={<bdi dir="auto">{name}</bdi>}
              subtitle={<bdi dir="ltr">{product.sku}</bdi>}
              actions={
                <ProductActions
                  product={product}
                  displayName={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('products.fields.basePrice')}>
                    {numberFormatter.format(product.basePrice)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('products.fields.discount')}>{discount(product)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('products.fields.variants')}>{variants(product)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('products.fields.newArrival')}>{newArrival(product)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('products.fields.status')}>{status(product)}</ResponsiveDataFact>
                  <ResponsiveDataFact label={t('products.fields.sortOrder')}>
                    {numberFormatter.format(product.sortOrder)}
                  </ResponsiveDataFact>
                </>
              }
              footer={<ProductImage url={product.images[0]?.url ?? null} name={name} className="size-20" />}
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
