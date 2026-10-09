import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { ProductSortBy, ProductSortDir, ProductsFilters } from '../types/product.types'

export const productSortValues: ProductSortBy[] = ['sort_order', 'name', 'base_price', 'created_at', 'rating_average']
export const productSortDirections: ProductSortDir[] = ['asc', 'desc']
export const productFilterNames = [
  'is_personalizable',
  'is_new_arrival',
  'has_discount',
  'price_min',
  'price_max',
  'created_from',
  'created_to',
  'sort_by',
  'sort_dir',
]

export const emptyProductsFilters: ProductsFilters = {
  isPersonalizable: null,
  isNewArrival: null,
  hasDiscount: null,
  priceMin: null,
  priceMax: null,
  createdFrom: '',
  createdTo: '',
  sortBy: null,
  sortDir: null,
}

const triState = (value?: string) => (value === '1' ? true : value === '0' ? false : null)
const optionalNumber = (value?: string) => {
  if (value === undefined || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN
}
const validDate = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function readProductsFilters(query: Record<string, string> | null): ProductsFilters {
  const sortBy = query?.sort_by as ProductSortBy | undefined
  const sortDir = query?.sort_dir as ProductSortDir | undefined
  return {
    isPersonalizable: triState(query?.is_personalizable),
    isNewArrival: triState(query?.is_new_arrival),
    hasDiscount: triState(query?.has_discount),
    priceMin: optionalNumber(query?.price_min),
    priceMax: optionalNumber(query?.price_max),
    createdFrom: query?.created_from ?? '',
    createdTo: query?.created_to ?? '',
    sortBy: sortBy && productSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && productSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validProductPriceRange(filters: Pick<ProductsFilters, 'priceMin' | 'priceMax'>) {
  return (
    (filters.priceMin === null || Number.isFinite(filters.priceMin)) &&
    (filters.priceMax === null || Number.isFinite(filters.priceMax)) &&
    (filters.priceMin === null || filters.priceMax === null || filters.priceMin <= filters.priceMax)
  )
}

export function validProductCreatedRange(filters: Pick<ProductsFilters, 'createdFrom' | 'createdTo'>) {
  return (
    validDate(filters.createdFrom) &&
    validDate(filters.createdTo) &&
    (!filters.createdFrom || !filters.createdTo || filters.createdFrom <= filters.createdTo)
  )
}

export function validProductsRanges(filters: ProductsFilters) {
  return validProductPriceRange(filters) && validProductCreatedRange(filters)
}

export function serializeProductsFilters(filters: ProductsFilters) {
  if (!validProductsRanges(filters)) throw new Error('Invalid product filter range')
  return {
    ...(filters.isPersonalizable !== null ? { is_personalizable: toApiBoolean(filters.isPersonalizable) } : {}),
    ...(filters.isNewArrival !== null ? { is_new_arrival: toApiBoolean(filters.isNewArrival) } : {}),
    ...(filters.hasDiscount !== null ? { has_discount: toApiBoolean(filters.hasDiscount) } : {}),
    ...(filters.priceMin !== null ? { price_min: filters.priceMin } : {}),
    ...(filters.priceMax !== null ? { price_max: filters.priceMax } : {}),
    ...(filters.createdFrom ? { created_from: filters.createdFrom } : {}),
    ...(filters.createdTo ? { created_to: filters.createdTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
