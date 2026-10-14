import { useTranslation } from 'react-i18next'
import FilterCombobox from '@/components/filters/FilterCombobox'
import FilterSelect from '@/components/filters/FilterSelect'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { useProduct } from '@/modules/products/hooks/useProduct'
import { emptyProductsFilters } from '@/modules/products/utils/product-filters'
import { getLocalizedProductName } from '@/modules/products/utils/product-list.utils'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { inventorySortDirections, readInventoryFilters } from '../utils/inventory-filters'

export function InventoryFilters() {
  const { t, i18n } = useTranslation()
  const { forwardQuery, forwardAddQuery, forwardDeleteQuery } = useQuery()
  const filters = readInventoryFilters(forwardQuery)
  const products = useProducts(emptyProductsFilters)
  const items = Array.from(
    new Map((products.data?.pages.flatMap((page) => page.items) ?? []).map((product) => [product.id, product])).values()
  )
  const loaded = items.some((product) => product.id === filters.productId)
  const selected = useProduct(!products.isLoading && !loaded ? filters.productId : null)
  const options = items.map((product) => ({
    value: String(product.id),
    label: getLocalizedProductName(product.name, i18n.language) + ' · ' + product.sku + ' (#' + product.id + ')',
  }))
  if (filters.productId !== null && !loaded) {
    options.unshift({
      value: String(filters.productId),
      label: selected.data
        ? getLocalizedProductName(selected.data.name, i18n.language) +
          ' · ' +
          selected.data.sku +
          ' (#' +
          selected.data.id +
          ')'
        : t('inventory.filters.selectedProduct', { id: filters.productId }),
    })
  }
  const failed = products.isError || products.isFetchNextPageError || selected.isError
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterCombobox
          id="product_id"
          name="product_id"
          label={t('inventory.fields.product')}
          placeholder={t('inventory.filters.allProducts')}
          data={options}
          valueKey="value"
          labelKey="label"
          aria-describedby="inventory-product-help"
          aria-busy={products.isFetching || selected.isFetching}
          pagination={{
            hasNextPage: Boolean(products.hasNextPage),
            isFetching: products.isFetching || selected.isFetching,
            isLoading: products.isLoading,
            isError: failed,
            onLoadMore: () => products.fetchNextPage(),
            onRetry: () => {
              if (selected.isError) return selected.refetch()
              return products.isFetchNextPageError ? products.fetchNextPage() : products.refetch()
            },
            loadingMessage: t('inventory.filters.loadingProducts'),
            moreMessage: t('inventory.filters.scrollProducts'),
            errorMessage: t('inventory.filters.productsError'),
            retryLabel: t('inventory.filters.retry'),
          }}
        />

        {filters.productId !== null && (
          <Button type="button" variant="ghost" onClick={() => forwardDeleteQuery('product_id')}>
            {t('inventory.filters.clearProduct')}
          </Button>
        )}
      </div>
      <FilterSelect
        name="stock_status"
        label={t('inventory.fields.status')}
        value={filters.stockStatus ?? 'all'}
        onValueChange={(value) =>
          value === 'all' ? forwardDeleteQuery('stock_status') : forwardAddQuery({ stock_status: value })
        }
        data={[
          { value: 'all', label: t('inventory.filters.allStatuses') },
          { value: 'in_stock', label: t('inventory.status.inStock') },
          { value: 'low_stock', label: t('inventory.status.lowStock') },
          { value: 'out_of_stock', label: t('inventory.status.outOfStock') },
        ]}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_by"
        label={t('inventory.filters.sortBy')}
        value={filters.sortBy ?? ''}
        placeholder={t('inventory.filters.defaultSort')}
        data={['quantity', 'product', 'updated_at'].map((value) => ({
          value,
          label: t('inventory.filters.sort.' + value),
        }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('inventory.filters.sortDir')}
        value={filters.sortDir ?? ''}
        placeholder={t('inventory.filters.defaultSort')}
        data={inventorySortDirections.map((value) => ({ value, label: t('inventory.filters.direction.' + value) }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
