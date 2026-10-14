import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormSelect } from '@/components/form'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { useProduct } from '@/modules/products/hooks/useProduct'
import { emptyProductsFilters } from '@/modules/products/utils/product-filters'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { useCategories } from '@/modules/categories/hooks/useCategories'
import { useCategory } from '@/modules/categories/hooks/useCategory'
import type { LocalizedName } from '@/types/localized-name.types'
import type { BannerDestinationType, BannerFormValues } from '../types/banner.types'

function DestinationSelect({ type, disabled, list, selected, detail }: {
  type: BannerDestinationType
  disabled: boolean
  list: ReturnType<typeof useProducts> | ReturnType<typeof useCategories>
  selected?: { id: number; name: LocalizedName }
  detail: { isError: boolean; isLoading: boolean; isFetching: boolean; refetch: () => Promise<unknown> }
}) {
  const { t, i18n } = useTranslation()
  const { getValues } = useFormContext<BannerFormValues>()
  const fieldName = type === 'product' ? 'product_id' : 'category_id'
  const options = list.data?.pages.flatMap(page => page.items.map(item => ({
    id: item.id, label: getLocalizedProductName(item.name, i18n.language),
  }))) ?? []
  if (selected && !options.some(option => option.id === selected.id)) {
    options.unshift({ id: selected.id, label: getLocalizedProductName(selected.name, i18n.language) })
  }
  return <FormSelect
    name={fieldName}
    label={t(`banners.fields.${type}`)} data={options} valueKey="id" labelKey="label"
    // The required selector has no clear action. Keep its saved ID while native options hydrate.
    deserializeValue={value => value ? Number(value) : getValues(fieldName)}
    disabled={disabled} required
    placeholder={t(detail.isLoading ? 'banners.destination.loading' : 'banners.destination.placeholder')}
    isLoading={list.isLoading || detail.isLoading}
    isFetchingNextPage={list.isFetchingNextPage} hasNextPage={list.hasNextPage}
    onLoadMore={() => { if (!list.isFetching && list.hasNextPage) return list.fetchNextPage() }}
    isError={list.isError || list.isFetchNextPageError || detail.isError}
    isRetrying={list.isFetching || detail.isFetching}
    onRetry={() => {
      if (detail.isError) return detail.refetch()
      return list.isFetchNextPageError ? list.fetchNextPage() : list.refetch()
    }}
    loadingMessage={t('banners.destination.loading')} emptyMessage={t('banners.destination.empty')}
    errorMessage={t('banners.destination.error')} retryLabel={t('banners.destination.retry')}
    loadMoreMessage={t('banners.destination.loadMore')}
  />
}

function ProductDestination({ disabled }: { disabled: boolean }) {
  const { control } = useFormContext<BannerFormValues>()
  const id = useWatch({ control, name: 'product_id' })
  const list = useProducts(emptyProductsFilters)
  const loaded = list.data?.pages.some(page => page.items.some(item => item.id === id))
  const detail = useProduct(!list.isLoading && !loaded && Number.isSafeInteger(id) && Number(id) > 0 ? id : null)
  return <DestinationSelect type="product" disabled={disabled} list={list} detail={detail} selected={detail.data} />
}

function CategoryDestination({ disabled }: { disabled: boolean }) {
  const { control } = useFormContext<BannerFormValues>()
  const id = useWatch({ control, name: 'category_id' })
  const list = useCategories()
  const loaded = list.data?.pages.some(page => page.items.some(item => item.id === id))
  const detail = useCategory(!loaded && Number.isSafeInteger(id) && Number(id) > 0 ? id : null, !list.isLoading)
  return <DestinationSelect type="category" disabled={disabled} list={list} detail={detail} selected={detail.data?.data} />
}

export function BannerDestinationFields({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const { control, setValue, clearErrors } = useFormContext<BannerFormValues>()
  const type = useWatch({ control, name: 'destination_type' })
  return <div className="grid gap-5 sm:grid-cols-2">
    <FormSelect name="destination_type" label={t('banners.fields.destinationType')}
      data={(['product', 'category'] as const).map(value => ({ value, label: t(`banners.fields.${value}`) }))}
      valueKey="value" labelKey="label" disabled={disabled} required
      onChange={next => {
        if (next === type) return
        setValue('product_id', null, { shouldDirty: true })
        setValue('category_id', null, { shouldDirty: true })
        clearErrors(['product_id', 'category_id'])
      }} />
    {type === 'product' && <ProductDestination disabled={disabled} />}
    {type === 'category' && <CategoryDestination disabled={disabled} />}
    {!type && <p className="text-sm text-muted-foreground">{t('banners.destination.choose')}</p>}
  </div>
}
