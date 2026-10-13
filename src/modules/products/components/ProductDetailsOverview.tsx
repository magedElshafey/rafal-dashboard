import { useTranslation } from 'react-i18next'

import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { SafeHtmlContent } from '@/components/shared/safe-html/SafeHtmlContent'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductDetailsSection } from '@/modules/products/components/ProductDetailsSection'
import { ProductImage } from '@/modules/products/components/ProductImage'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = { product?: ProductDetail }

export function ProductDetailsOverview({ product }: Props) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 })
  const number = (value: number | null | undefined) => (value == null ? '—' : numbers.format(value))
  const date = (value: string | null | undefined) => formatDateTime(value, { locale }) || '—'
  const yesNo = (value: boolean | undefined) => t(value ? 'products.filters.yes' : 'products.filters.no')
  const name = product ? getLocalizedProductName(product.name, i18n.language) : ''
  const description = product ? getLocalizedProductName(product.description, i18n.language) : ''
  const groups = [
    {
      title: t('products.create.sections.pricing.title'),
      rows: [
        [t('products.fields.basePrice'), number(product?.basePrice)],
        [t('products.details.basePriceInclVat'), number(product?.basePriceInclVat)],
        [
          t('products.fields.discount'),
          product?.discountPercentage == null
            ? '—'
            : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 20 }).format(
                product.discountPercentage / 100
              ),
        ],
        [t('products.create.fields.discountEndAt'), date(product?.discountEndAt)],
      ],
    },
    {
      title: t('products.create.sections.settings.title'),
      rows: [
        [t('products.create.fields.isPersonalizable'), yesNo(product?.isPersonalizable)],
        [t('products.create.fields.personalizationMaxLength'), number(product?.personalizationMaxLength)],
        [t('products.create.fields.personalizationFee'), number(product?.personalizationFee)],
        [t('products.create.fields.maxCartItemQuantity'), number(product?.maxCartItemQuantity)],
        [t('products.create.fields.isNewArrival'), yesNo(product?.isNewArrival)],
        [t('products.fields.sortOrder'), number(product?.sortOrder)],
      ],
    },
    {
      title: t('products.details.metadata'),
      rows: [
        [t('products.details.createdAt'), date(product?.createdAt)],
        [t('products.details.updatedAt'), date(product?.updatedAt)],
        [t('products.details.simulatedViewers'), number(product?.simulatedViewersCount)],
        [t('products.details.simulatedOrders'), number(product?.simulatedOrdersCount)],
      ],
    },
  ]

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <ProductDetailsSection title={t('products.create.sections.images.title')}>
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {product ? (
              <ProductImage url={product.images[0]?.url ?? null} name={name} className="size-full object-contain" />
            ) : (
              <Skeleton className="size-full" />
            )}
          </div>
          <ul className="grid min-h-20 grid-cols-3 gap-3" aria-label={t('products.details.additionalImages')}>
            {product
              ? product.images.slice(1).map((image) => (
                  <li key={image.id} className="min-w-0">
                    <ProductImage url={image.url} name={name} className="h-auto w-full object-contain" />
                  </li>
                ))
              : [0, 1, 2].map((key) => (
                  <li key={key}>
                    <Skeleton className="aspect-square w-full" />
                  </li>
                ))}
          </ul>
        </ProductDetailsSection>
        <ProductDetailsSection title={t('products.details.overview')}>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              [t('products.details.identifier'), number(product?.id)],
              [t('products.fields.sku'), product?.sku.trim() || '—'],
              [
                t('products.create.fields.category'),
                product?.category ? getLocalizedProductName(product.category.name, i18n.language) : '—',
              ],
              [t('products.details.slug'), product?.slug.trim() || '—'],
            ].map(([label, value]) => (
              <ResponsiveDataFact key={label} label={label}>
                {product ? <bdi dir="auto">{value}</bdi> : <Skeleton className="h-5 w-32 max-w-full" />}
              </ResponsiveDataFact>
            ))}
          </dl>
          <div className="min-h-32 space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">{t('products.create.sections.description.title')}</h3>
            {product ? (
              <SafeHtmlContent
                // Product descriptions are nested content, not page/section headings.
                html={description.replace(/<(\/?)h[1-6](?=[\s/>])/gi, '<$1p')}
                variant="compact"
                className="max-w-prose overflow-x-auto text-sm [overflow-wrap:anywhere]"
                emptyFallback="—"
              />
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            )}
          </div>
        </ProductDetailsSection>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-3">
        {groups.map((group) => (
          <ProductDetailsSection key={group.title} title={group.title}>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {group.rows.map(([label, value]) => (
                <ResponsiveDataFact key={label} label={label}>
                  {product ? <bdi>{value}</bdi> : <Skeleton className="h-5 w-32 max-w-full" />}
                </ResponsiveDataFact>
              ))}
            </dl>
          </ProductDetailsSection>
        ))}
      </div>
    </>
  )
}
