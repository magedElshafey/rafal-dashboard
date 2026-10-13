import { ArrowLeft, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductDetailsOverview } from '@/modules/products/components/ProductDetailsOverview'
import { ProductDetailsVariants } from '@/modules/products/components/ProductDetailsVariants'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { Routes } from '@/routes/routes'

export function ProductDetailsHeader({ product, loading = false }: { product?: ProductDetail; loading?: boolean }) {
  const { t, i18n } = useTranslation()
  const name = product ? getLocalizedProductName(product.name, i18n.language) : t('products.details.title')
  return (
    <DashboardPageHeader
      className="min-h-24"
      title={
        loading ? (
          <>
            <span className="sr-only">{name}</span>
            <span
              aria-hidden="true"
              className="block h-9 w-64 max-w-full rounded-md bg-accent motion-safe:animate-pulse"
            />
          </>
        ) : (
          <bdi className="[overflow-wrap:anywhere]">{name}</bdi>
        )
      }
      description={
        loading ? (
          <span aria-hidden="true" className="block h-6 w-40 rounded-md bg-accent motion-safe:animate-pulse" />
        ) : product ? (
          <>
            <Badge variant={product.isActive ? 'success' : 'outline'}>
              {t(product.isActive ? 'products.status.active' : 'products.status.inactive')}
            </Badge>
            {product.isNewArrival ? (
              <Badge variant="secondary" className="ms-2">
                {t('products.flags.newArrival')}
              </Badge>
            ) : null}
          </>
        ) : undefined
      }
      actions={
        <>
          {loading ? (
            <Skeleton aria-hidden="true" className="h-9 w-44" />
          ) : (
            <Button variant="outline" asChild>
              <Link to={Routes.products}>
                <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
                {t('products.details.back')}
              </Link>
            </Button>
          )}
          {product ? (
            <Button asChild>
              <Link to={Routes.productEditPath(product.id)} aria-label={t('products.actions.editNamed', { name })}>
                <Pencil aria-hidden="true" />
                {t('products.actions.edit')}
              </Link>
            </Button>
          ) : loading ? (
            <Skeleton aria-hidden="true" className="h-9 w-24" />
          ) : null}
        </>
      }
    />
  )
}

export function ProductDetailsLayout({ product }: { product?: ProductDetail }) {
  return (
    <>
      <ProductDetailsHeader product={product} loading={!product} />
      <div className="space-y-5">
        <ProductDetailsOverview product={product} />
        <ProductDetailsVariants product={product} />
      </div>
    </>
  )
}

export function ProductDetailsSkeleton() {
  return <ProductDetailsLayout />
}
