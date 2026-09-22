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
import { ProductImage } from '@/modules/products/components/ProductImage'
import type { ProductListItem } from '@/modules/products/types/product.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'

type Props = {
  products: readonly ProductListItem[]
}

export function ProductsList({ products }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }), [locale])
  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 20 }),
    [locale]
  )
  const columns = [
    { id: 'product', header: t('products.fields.product') },
    { id: 'sku', header: t('products.fields.sku'), className: 'w-36' },
    { id: 'basePrice', header: t('products.fields.basePrice'), className: 'w-28' },
    { id: 'discount', header: t('products.fields.discount'), className: 'w-28' },
    { id: 'variants', header: t('products.fields.variants'), className: 'w-28' },
    { id: 'newArrival', header: t('products.fields.newArrival'), className: 'w-28' },
    { id: 'status', header: t('products.fields.status'), className: 'w-24' },
    { id: 'sortOrder', header: t('products.fields.sortOrder'), className: 'w-24' },
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
        <ResponsiveDataTable columns={columns}>
          {products.map((product) => {
            const name = getLocalizedProductName(product.name, i18n.language)
            return (
              <ResponsiveDataTableRow key={product.id}>
                <ResponsiveDataTableCell className="max-w-72 whitespace-normal">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductImage url={product.primaryImageUrl} name={name} />
                    <bdi dir="auto" className="min-w-0 break-words font-medium text-content-primary">
                      {name}
                    </bdi>
                  </div>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <bdi dir="ltr" className="font-mono text-xs">
                    {product.sku}
                  </bdi>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(product.basePrice)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{discount(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{variants(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{newArrival(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{status(product)}</ResponsiveDataTableCell>
                <ResponsiveDataTableCell>{numberFormatter.format(product.sortOrder)}</ResponsiveDataTableCell>
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
              footer={<ProductImage url={product.primaryImageUrl} name={name} className="size-20" />}
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
