import type {
  ProductCreateResponse,
  ProductDeleteResponse,
  ProductsIndexResponse,
  RawProductDetail,
  RawProductDetailResponse,
  RawProductListItem,
} from '@/modules/products/types/product.types'
import type {
  ProductVariantDeleteResponse,
  ProductVariantResponse,
  JsonValue,
  RawProductVariant,
  RawVariantWarehouseStock,
  VariantWarehouseStockDeleteResponse,
  VariantWarehouseStockResponse,
} from '@/modules/products/types/product-variant.types'

const LIST_SEED: RawProductListItem[] = [
  {
    id: 1,
    category_id: 4,
    sku: 'RFL-NECK-001',
    name: { ar: 'عقد لؤلؤ', en: 'Pearl Necklace' },
    slug: 'pearl-necklace',
    base_price: '250.00',
    discount_percentage: null,
    discount_end_at: null,
    is_personalizable: false,
    is_new_arrival: true,
    is_active: true,
    sort_order: 1,
    simulated_viewers_count: 124,
    simulated_orders_count: 38,
    variants: [],
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=320&q=80'],
    created_at: '2026-09-14T18:02:44+00:00',
    updated_at: '2026-09-14T18:02:44+00:00',
  },
  {
    id: 2,
    category_id: 5,
    sku: 'RFL-RING-002',
    name: { ar: 'خاتم ذهبي', en: 'Gold Ring' },
    slug: 'gold-ring',
    base_price: '480.50',
    discount_percentage: '15',
    discount_end_at: '2026-10-01 00:00:00',
    is_personalizable: true,
    is_new_arrival: false,
    is_active: true,
    sort_order: 2,
    simulated_viewers_count: 256,
    simulated_orders_count: 75,
    variants: [{}, {}],
    images: [],
    created_at: '2026-09-15T10:00:00+00:00',
    updated_at: '2026-09-18T10:00:00+00:00',
  },
  {
    id: 3,
    category_id: null,
    sku: 'RFL-BRACE-003',
    name: { ar: 'سوار فضي', en: 'Silver Bracelet' },
    slug: 'silver-bracelet',
    base_price: '175.00',
    discount_percentage: null,
    discount_end_at: null,
    is_personalizable: false,
    is_new_arrival: false,
    is_active: false,
    sort_order: 3,
    simulated_viewers_count: 80,
    simulated_orders_count: 12,
    variants: [{}],
    images: [],
    created_at: '2026-09-16T12:00:00+00:00',
    updated_at: '2026-09-16T12:00:00+00:00',
  },
]

const PAGE_SIZE = 15
const LATENCY = 180
const cloneJson = (value: JsonValue): JsonValue => {
  if (Array.isArray(value)) return value.map(cloneJson)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJson(item)]))
  }
  return value
}
const toJson = (value: unknown): JsonValue => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map(toJson)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJson(item)]))
  }
  return {}
}
const isRawWarehouseStock = (value: unknown): value is RawVariantWarehouseStock => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    (typeof record.warehouse_id === 'number' || typeof record.warehouse_id === 'string') &&
    (typeof record.quantity === 'number' || typeof record.quantity === 'string')
  )
}
const toVariant = (product: RawProductListItem, value: unknown, index: number): RawProductVariant => {
  const variant = typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
  const record = variant as Record<string, unknown>
  return {
    id: typeof record.id === 'number' || typeof record.id === 'string' ? record.id : product.id * 1000 + index + 1,
    sku: typeof record.sku === 'string' ? record.sku : `${product.sku}-V${index + 1}`,
    attributes: record.attributes === undefined ? {} : toJson(record.attributes),
    price_override:
      typeof record.price_override === 'number' || typeof record.price_override === 'string'
        ? record.price_override
        : null,
    is_active:
      typeof record.is_active === 'boolean' || record.is_active === 0 || record.is_active === 1
        ? record.is_active
        : true,
    images: Array.isArray(record.images) ? (record.images as RawProductVariant['images']) : [],
    warehouse_stocks: Array.isArray(record.warehouse_stocks) ? record.warehouse_stocks.filter(isRawWarehouseStock) : [],
  }
}
const toDetail = (product: RawProductListItem): RawProductDetail => ({
  ...product,
  description: [],
  personalization_max_length: null,
  personalization_fee: null,
  hide_price_on_packaging: false,
  variants: product.variants.map((variant, index) => toVariant(product, variant, index)),
  images: product.images.map((url, index) => ({ id: product.id * 100 + index + 1, url })),
})
const clone = (product: RawProductDetail): RawProductDetail => ({
  ...product,
  name: { ...product.name },
  description: Array.isArray(product.description) ? [] : product.description ? { ...product.description } : null,
  variants: product.variants.map((variant) => ({
    ...variant,
    attributes: cloneJson(variant.attributes),
    images: variant.images.map((image) => ({ ...image })),
    warehouse_stocks: [...variant.warehouse_stocks],
  })),
  images: product.images.map((image) => ({ ...image })),
})
const toList = (product: RawProductDetail): RawProductListItem => ({
  id: Number(product.id),
  category_id: product.category_id === null ? null : Number(product.category_id),
  sku: product.sku,
  name: { ar: product.name.ar ?? '', en: product.name.en ?? '' },
  slug: product.slug,
  base_price: String(product.base_price),
  discount_percentage: product.discount_percentage,
  discount_end_at: product.discount_end_at,
  is_personalizable:
    product.is_personalizable === true || product.is_personalizable === 1 || product.is_personalizable === '1',
  is_new_arrival: product.is_new_arrival === true || product.is_new_arrival === 1 || product.is_new_arrival === '1',
  is_active: product.is_active === true || product.is_active === 1 || product.is_active === '1',
  sort_order: Number(product.sort_order),
  simulated_viewers_count: Number(product.simulated_viewers_count),
  simulated_orders_count: Number(product.simulated_orders_count),
  variants: [...product.variants],
  images: product.images.map(({ url }) => url),
  created_at: product.created_at,
  updated_at: product.updated_at,
})

let products = LIST_SEED.map(toDetail)
let nextId = 4
let nextVariantId = Math.max(0, ...products.flatMap((product) => product.variants.map(({ id }) => Number(id)))) + 1

function wait(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const onAbort = () => {
      window.clearTimeout(timeout)
      reject(signal?.reason)
    }
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, LATENCY)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function resetProductsMock() {
  products = LIST_SEED.map(toDetail)
  nextId = 4
  nextVariantId = Math.max(0, ...products.flatMap((product) => product.variants.map(({ id }) => Number(id)))) + 1
}
export function seedProductsMock(nextProducts: RawProductListItem[]) {
  products = nextProducts.map(toDetail)
  nextId = Math.max(0, ...products.map(({ id }) => Number(id))) + 1
  nextVariantId = Math.max(0, ...products.flatMap((product) => product.variants.map(({ id }) => Number(id)))) + 1
}

function text(body: FormData, key: string) {
  const value = body.get(key)
  return typeof value === 'string' ? value.trim() : null
}
function requiredText(body: FormData, key: string) {
  const value = text(body, key)
  if (!value) throw new Error(`Missing Product field: ${key}`)
  return value
}
function nullableText(body: FormData, key: string) {
  const value = text(body, key)
  return value === 'null' || !value ? null : value
}
function booleanValue(body: FormData, key: string) {
  return requiredText(body, key) === '1'
}

export const productsMockTransport = {
  async list(page: number, signal?: AbortSignal): Promise<ProductsIndexResponse> {
    await wait(signal)
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: products.slice(start, start + PAGE_SIZE).map(toList),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(products.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: products.length,
      },
    }
  },
  async show(id: number, signal?: AbortSignal): Promise<RawProductDetailResponse> {
    await wait(signal)
    const product = products.find((item) => Number(item.id) === id)
    if (!product) throw new Error('Product not found')
    return { success: true, message: 'Product retrieved successfully', data: clone(product) }
  },
  async create(body: FormData): Promise<ProductCreateResponse> {
    await wait()
    const id = nextId++
    const now = new Date().toISOString()
    const sku = requiredText(body, 'sku')
    const product: RawProductDetail = {
      id,
      category_id: Number(requiredText(body, 'category_id')),
      sku,
      name: { ar: requiredText(body, 'name[ar]'), en: nullableText(body, 'name[en]') ?? '' },
      description: { ar: nullableText(body, 'description[ar]') ?? '', en: nullableText(body, 'description[en]') ?? '' },
      slug:
        sku
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `product-${id}`,
      base_price: requiredText(body, 'base_price'),
      discount_percentage: nullableText(body, 'discount_percentage'),
      discount_end_at: nullableText(body, 'discount_end_at'),
      is_personalizable: booleanValue(body, 'is_personalizable'),
      personalization_max_length: nullableText(body, 'personalization_max_length'),
      personalization_fee: nullableText(body, 'personalization_fee'),
      hide_price_on_packaging: booleanValue(body, 'hide_price_on_packaging'),
      is_new_arrival: booleanValue(body, 'is_new_arrival'),
      is_active: booleanValue(body, 'is_active'),
      sort_order: Number(requiredText(body, 'sort_order')),
      simulated_viewers_count: 0,
      simulated_orders_count: 0,
      variants: [],
      images: body
        .getAll('images[]')
        .filter((value): value is File => value instanceof File)
        .map((_, index) => ({ id: id * 100 + index + 1, url: `mock://products/${id}/images/${index + 1}` })),
      created_at: now,
      updated_at: now,
    }
    products.unshift(product)
    return { success: true, message: 'Product created successfully', data: { id } }
  },
  async update(id: number, body: FormData): Promise<RawProductDetailResponse> {
    await wait()
    const index = products.findIndex((item) => Number(item.id) === id)
    if (index < 0) throw new Error('Product not found')
    const next = clone(products[index])
    const assign = (key: string, callback: (value: string | null) => void) => {
      if (body.has(key)) callback(nullableText(body, key))
    }
    assign('category_id', (value) => {
      if (value !== null) next.category_id = Number(value)
    })
    assign('sku', (value) => {
      if (value !== null) next.sku = value
    })
    assign('name[ar]', (value) => {
      next.name.ar = value ?? ''
    })
    assign('name[en]', (value) => {
      next.name.en = value ?? ''
    })
    const description =
      Array.isArray(next.description) || next.description === null ? { ar: '', en: '' } : { ...next.description }
    assign('description[ar]', (value) => {
      description.ar = value ?? ''
    })
    assign('description[en]', (value) => {
      description.en = value ?? ''
    })
    next.description = description
    assign('base_price', (value) => {
      if (value !== null) next.base_price = value
    })
    assign('discount_percentage', (value) => {
      next.discount_percentage = value
    })
    assign('discount_end_at', (value) => {
      next.discount_end_at = value
    })
    assign('personalization_max_length', (value) => {
      next.personalization_max_length = value
    })
    assign('personalization_fee', (value) => {
      next.personalization_fee = value
    })
    assign('sort_order', (value) => {
      if (value !== null) next.sort_order = Number(value)
    })
    if (body.has('is_personalizable')) next.is_personalizable = booleanValue(body, 'is_personalizable')
    if (body.has('hide_price_on_packaging'))
      next.hide_price_on_packaging = booleanValue(body, 'hide_price_on_packaging')
    if (body.has('is_new_arrival')) next.is_new_arrival = booleanValue(body, 'is_new_arrival')
    if (body.has('is_active')) next.is_active = booleanValue(body, 'is_active')
    const uploaded = body.getAll('images[]').filter((value): value is File => value instanceof File)
    next.images.push(
      ...uploaded.map((_, imageIndex) => ({
        id: id * 1000 + next.images.length + imageIndex + 1,
        url: `mock://products/${id}/images/new-${imageIndex + 1}`,
      }))
    )
    next.updated_at = new Date().toISOString()
    products[index] = next
    return { success: true, message: 'Product updated successfully', data: clone(next) }
  },
  async delete(id: number): Promise<ProductDeleteResponse> {
    await wait()
    const index = products.findIndex((item) => Number(item.id) === id)
    if (index < 0) throw new Error('Product not found')
    products.splice(index, 1)
    return { success: true, message: 'Product deleted successfully' }
  },
  async createVariant(productId: number, body: FormData): Promise<ProductVariantResponse> {
    await wait()
    const product = products.find((item) => Number(item.id) === productId)
    if (!product) throw new Error('Product not found')
    const id = nextVariantId++
    const attributes: Record<string, string> = {}
    for (const [key, value] of body.entries()) {
      const match = /^attributes\[(.+)\]$/.exec(key)
      if (match && typeof value === 'string') attributes[match[1]] = value
    }
    const variant: RawProductVariant = {
      id,
      sku: requiredText(body, 'sku'),
      attributes,
      price_override: nullableText(body, 'price_override'),
      is_active: booleanValue(body, 'is_active'),
      images: body
        .getAll('images[]')
        .filter((value): value is File => value instanceof File)
        .map((_, index) => ({ id: id * 100 + index + 1, url: `mock://variants/${id}/images/${index + 1}` })),
      warehouse_stocks: [],
    }
    product.variants.push(variant)
    product.updated_at = new Date().toISOString()
    return { success: true, message: 'Product Variant created successfully', data: clone(product).variants.at(-1)! }
  },
  async deleteVariant(productId: number, variantId: number): Promise<ProductVariantDeleteResponse> {
    await wait()
    const product = products.find((item) => Number(item.id) === productId)
    if (!product) throw new Error('Product not found')
    const index = product.variants.findIndex((variant) => Number(variant.id) === variantId)
    if (index < 0) throw new Error('Product Variant not found')
    product.variants.splice(index, 1)
    product.updated_at = new Date().toISOString()
    return { success: true, message: 'Product Variant deleted successfully' }
  },
  async putStock(
    productId: number,
    variantId: number,
    warehouseId: number,
    body: FormData
  ): Promise<VariantWarehouseStockResponse> {
    await wait()
    const product = products.find((item) => Number(item.id) === productId)
    const variant = product?.variants.find((item) => Number(item.id) === variantId)
    if (!product || !variant) throw new Error('Product Variant not found')
    const quantity = Number(requiredText(body, 'quantity'))
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Invalid stock quantity')
    const stock = { warehouse_id: warehouseId, quantity }
    const index = variant.warehouse_stocks.findIndex((item) => Number(item.warehouse_id) === warehouseId)
    if (index < 0) variant.warehouse_stocks.push(stock)
    else variant.warehouse_stocks[index] = stock
    product.updated_at = new Date().toISOString()
    return { success: true, message: 'Variant warehouse stock saved successfully', data: { ...stock } }
  },
  async deleteStock(
    productId: number,
    variantId: number,
    warehouseId: number
  ): Promise<VariantWarehouseStockDeleteResponse> {
    await wait()
    const product = products.find((item) => Number(item.id) === productId)
    const variant = product?.variants.find((item) => Number(item.id) === variantId)
    if (!product || !variant) throw new Error('Product Variant not found')
    const index = variant.warehouse_stocks.findIndex((item) => Number(item.warehouse_id) === warehouseId)
    if (index < 0) throw new Error('Variant warehouse stock not found')
    variant.warehouse_stocks.splice(index, 1)
    product.updated_at = new Date().toISOString()
    return { success: true, message: 'Variant warehouse stock deleted successfully' }
  },
  async deleteMedia(mediaId: number): Promise<ProductDeleteResponse> {
    await wait()
    const product = products.find(
      (item) =>
        item.images.some((image) => Number(image.id) === mediaId) ||
        item.variants.some((variant) => variant.images.some((image) => Number(image.id) === mediaId))
    )
    if (!product) throw new Error('Media not found')
    product.images = product.images.filter((image) => Number(image.id) !== mediaId)
    product.variants.forEach((variant) => {
      variant.images = variant.images.filter((image) => Number(image.id) !== mediaId)
    })
    product.updated_at = new Date().toISOString()
    return { success: true, message: 'Media deleted successfully' }
  },
}
