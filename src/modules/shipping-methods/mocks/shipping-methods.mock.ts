import type {
  DeleteShippingMethodResponse,
  RawShippingMethod,
  RawShippingMethodResponse,
  ShippingMethodsIndexResponse,
} from '@/modules/shipping-methods/types/shipping-method.types'

const INITIAL_SHIPPING_METHODS: RawShippingMethod[] = [
  {
    id: 1,
    code: 'standard',
    name: { ar: 'شحن عادي', en: 'Standard Shipping' },
    eta_label: { ar: '٣-٥ أيام عمل', en: '3-5 business days' },
    price: '25.00',
    is_pickup: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-09-20T19:55:22+00:00',
    updated_at: '2026-09-20T19:55:22+00:00',
  },
  {
    id: 2,
    code: 'express',
    name: { ar: 'شحن سريع', en: 'Express Shipping' },
    eta_label: { ar: '١-٢ يوم عمل', en: '1-2 business days' },
    price: '45.00',
    is_pickup: false,
    is_active: true,
    sort_order: 2,
    created_at: '2026-09-20T19:55:22+00:00',
    updated_at: '2026-09-20T19:55:22+00:00',
  },
  {
    id: 3,
    code: 'branch-pickup',
    name: { ar: 'استلام من الفرع', en: 'Branch Pickup' },
    eta_label: { ar: 'جاهز خلال يوم عمل', en: 'Ready within 1 business day' },
    price: '0',
    is_pickup: true,
    is_active: true,
    sort_order: 3,
    created_at: '2026-09-20T19:55:22+00:00',
    updated_at: '2026-09-20T19:55:22+00:00',
  },
]

let shippingMethods = INITIAL_SHIPPING_METHODS.map(cloneShippingMethod)
let nextId = 4
const PAGE_SIZE = 15
const LATENCY = 180

function cloneShippingMethod(method: RawShippingMethod): RawShippingMethod {
  return { ...method, name: { ...method.name }, eta_label: { ...method.eta_label } }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

function stringValue(body: FormData, key: string) {
  const value = body.get(key)
  return typeof value === 'string' ? value : undefined
}

function requiredString(body: FormData, key: string) {
  const value = stringValue(body, key)
  if (value === undefined) throw new Error(`Missing ${key}`)
  return value
}

function booleanValue(body: FormData, key: string) {
  const value = stringValue(body, key)
  return value === undefined ? undefined : value === '1'
}

export function resetShippingMethodsMock() {
  shippingMethods = INITIAL_SHIPPING_METHODS.map(cloneShippingMethod)
  nextId = 4
}

export function seedShippingMethodsMock(methods: RawShippingMethod[]) {
  shippingMethods = methods.map(cloneShippingMethod)
  nextId = Math.max(0, ...shippingMethods.map((method) => method.id)) + 1
}

export const shippingMethodsMockTransport = {
  async list(page: number): Promise<ShippingMethodsIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Shipping methods retrieved successfully',
      data: shippingMethods.slice(start, start + PAGE_SIZE).map(cloneShippingMethod),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(shippingMethods.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: shippingMethods.length,
      },
    }
  },
  async create(body: FormData): Promise<RawShippingMethodResponse> {
    await wait()
    const now = new Date().toISOString()
    const method: RawShippingMethod = {
      id: nextId++,
      code: requiredString(body, 'code'),
      name: { ar: requiredString(body, 'name[ar]'), en: requiredString(body, 'name[en]') },
      eta_label: {
        ar: requiredString(body, 'eta_label[ar]'),
        en: requiredString(body, 'eta_label[en]'),
      },
      price: requiredString(body, 'price'),
      is_pickup: requiredString(body, 'is_pickup') === '1',
      is_active: requiredString(body, 'is_active') === '1',
      sort_order: Number(stringValue(body, 'sort_order') ?? 0),
      created_at: now,
      updated_at: now,
    }
    shippingMethods.unshift(method)
    return { success: true, message: 'Shipping method created successfully', data: cloneShippingMethod(method) }
  },
  async update(id: number, body: FormData): Promise<RawShippingMethodResponse> {
    await wait()
    const index = shippingMethods.findIndex((method) => method.id === id)
    if (index < 0) throw new Error('Shipping method not found')
    const current = shippingMethods[index]
    const updated: RawShippingMethod = {
      ...current,
      code: stringValue(body, 'code') ?? current.code,
      name: {
        ar: stringValue(body, 'name[ar]') ?? current.name.ar,
        en: stringValue(body, 'name[en]') ?? current.name.en,
      },
      eta_label: {
        ar: stringValue(body, 'eta_label[ar]') ?? current.eta_label.ar,
        en: stringValue(body, 'eta_label[en]') ?? current.eta_label.en,
      },
      price: stringValue(body, 'price') ?? current.price,
      is_pickup: booleanValue(body, 'is_pickup') ?? current.is_pickup,
      is_active: booleanValue(body, 'is_active') ?? current.is_active,
      sort_order: Number(stringValue(body, 'sort_order') ?? current.sort_order),
      updated_at: new Date().toISOString(),
    }
    shippingMethods[index] = updated
    return { success: true, message: 'Shipping method updated successfully', data: cloneShippingMethod(updated) }
  },
  async delete(id: number): Promise<DeleteShippingMethodResponse> {
    await wait()
    shippingMethods = shippingMethods.filter((method) => method.id !== id)
    return { success: true, message: 'Shipping method deleted successfully' }
  },
}
