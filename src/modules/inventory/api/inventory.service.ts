import { z } from 'zod'

import { normalizeVariantAttributes } from '@/modules/products/api/product-variants.service'
import type { InventoryPage } from '@/modules/inventory/types/inventory.types'
import { $http } from '@/utils/http'

const id = z.number().int().positive().safe()
const responseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      id,
      // Same warehouse-stock balance contract as Product Show and stock SET.
      quantity: z.number().int().nonnegative().safe(),
      stock_status: z.string().min(1),
      warehouse: z.object({ id, name: z.string() }),
      product: z.object({
        id,
        sku: z.string(),
        name: z.object({ ar: z.string(), en: z.string() }),
        is_active: z.boolean(),
      }),
      variant: z.object({
        id,
        sku: z.string(),
        attributes: z.union([z.record(z.string()), z.tuple([]), z.null()]),
        is_active: z.boolean(),
        is_default: z.boolean(),
      }),
      updated_at: z.string().datetime({ offset: true }),
    })
  ),
  meta: z.object({
    current_page: id,
    last_page: id,
    per_page: id,
    total: z.number().int().nonnegative().safe(),
    low_stock_threshold: z.number().finite(),
  }),
})

export function parseInventoryResponse(value: unknown): InventoryPage {
  const response = responseSchema.parse(value)
  if (new Set(response.data.map((stock) => stock.id)).size !== response.data.length) {
    throw new Error('Duplicate inventory stock identity')
  }
  return {
    items: response.data.map((stock) => ({
      id: stock.id,
      quantity: stock.quantity,
      stockStatus: stock.stock_status,
      warehouse: stock.warehouse,
      product: {
        id: stock.product.id,
        sku: stock.product.sku,
        name: stock.product.name,
        isActive: stock.product.is_active,
      },
      variant: {
        id: stock.variant.id,
        sku: stock.variant.sku,
        attributes: normalizeVariantAttributes(stock.variant.attributes),
        isActive: stock.variant.is_active,
        isDefault: stock.variant.is_default,
      },
      updatedAt: stock.updated_at,
    })),
    meta: response.meta,
  }
}

export const inventoryService = {
  async list(warehouseId: number, page: number, signal?: AbortSignal): Promise<InventoryPage> {
    id.parse(warehouseId)
    id.parse(page)
    const response = await $http.get<unknown>({
      url: '/dashboard/warehouse-stocks',
      query: { warehouse_id: warehouseId, page },
      signal,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    const parsed = parseInventoryResponse(response.data)
    if (parsed.items.some((stock) => stock.warehouse.id !== warehouseId)) {
      throw new Error('Inventory warehouse scope mismatch')
    }
    if (page <= parsed.meta.last_page && parsed.meta.current_page !== page) {
      throw new Error('Inventory page mismatch')
    }
    return parsed
  },
}
