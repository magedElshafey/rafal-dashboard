import type {
  ProductCreateResponse,
  ProductsIndexResponse,
  RawProductListItem,
} from '@/modules/products/types/product.types'

const INITIAL_PRODUCTS: RawProductListItem[] = [
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
    discount_end_at: '2026-10-01T00:00:00+00:00',
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
    images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=320&q=80'],
    created_at: '2026-09-16T12:00:00+00:00',
    updated_at: '2026-09-16T12:00:00+00:00',
  },
]

const PAGE_SIZE = 15
const LATENCY = 180
let products = INITIAL_PRODUCTS.map(cloneProduct)
let nextId = Math.max(...INITIAL_PRODUCTS.map((product) => product.id)) + 1

function cloneProduct(product: RawProductListItem): RawProductListItem {
  return {
    ...product,
    name: { ...product.name },
    variants: [...product.variants],
    images: [...product.images],
  }
}

function wait(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }

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
  products = INITIAL_PRODUCTS.map(cloneProduct)
  nextId = Math.max(...INITIAL_PRODUCTS.map((product) => product.id)) + 1
}

export function seedProductsMock(nextProducts: RawProductListItem[]) {
  products = nextProducts.map(cloneProduct)
  nextId = Math.max(0, ...products.map((product) => product.id)) + 1
}

function requiredText(body: FormData, key: string) {
  const value = body.get(key)
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`Missing Product Create field: ${key}`)
  return value.trim()
}

function optionalText(body: FormData, key: string) {
  const value = body.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function booleanValue(body: FormData, key: string) {
  return requiredText(body, key) === '1'
}

function mockSlug(sku: string, id: number) {
  const normalized = sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return normalized || `product-${id}`
}

export const productsMockTransport = {
  async list(page: number, signal?: AbortSignal): Promise<ProductsIndexResponse> {
    await wait(signal)
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: products.slice(start, start + PAGE_SIZE).map(cloneProduct),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(products.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: products.length,
      },
    }
  },
  async create(body: FormData): Promise<ProductCreateResponse> {
    await wait()
    const id = nextId++
    const timestamp = new Date().toISOString()
    const sku = requiredText(body, 'sku')
    const images = body
      .getAll('images[]')
      .filter((value): value is File => value instanceof File)
      .map((_, index) => `mock://products/${id}/images/${index + 1}`)
    const product: RawProductListItem = {
      id,
      category_id: Number(requiredText(body, 'category_id')),
      sku,
      name: { ar: requiredText(body, 'name[ar]'), en: optionalText(body, 'name[en]') ?? '' },
      slug: mockSlug(sku, id),
      base_price: requiredText(body, 'base_price'),
      discount_percentage: optionalText(body, 'discount_percentage'),
      discount_end_at: optionalText(body, 'discount_end_at'),
      is_personalizable: booleanValue(body, 'is_personalizable'),
      is_new_arrival: booleanValue(body, 'is_new_arrival'),
      is_active: booleanValue(body, 'is_active'),
      sort_order: Number(requiredText(body, 'sort_order')),
      simulated_viewers_count: 0,
      simulated_orders_count: 0,
      variants: [],
      images,
      created_at: timestamp,
      updated_at: timestamp,
    }
    const createdProduct = {
      ...product,
      description: {
        ar: optionalText(body, 'description[ar]') ?? '',
        en: optionalText(body, 'description[en]') ?? '',
      },
      personalization_max_length: optionalText(body, 'personalization_max_length'),
      personalization_fee: optionalText(body, 'personalization_fee'),
      hide_price_on_packaging: booleanValue(body, 'hide_price_on_packaging'),
    }
    products.unshift(product)
    return { success: true, message: 'Product created successfully', data: createdProduct }
  },
}
