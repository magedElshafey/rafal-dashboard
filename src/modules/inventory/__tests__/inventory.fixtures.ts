import { parseInventoryResponse } from '@/modules/inventory/api/inventory.service'

export function rawStock(id = 172, warehouseId = 6, variantId = 45) {
  return {
    id,
    quantity: 88,
    stock_status: 'in_stock',
    warehouse: { id: warehouseId, name: `Warehouse ${warehouseId}` },
    product: { id: 22, sku: 'PRODUCT-22', name: { ar: 'عطر مسك أبيض', en: 'White Musk Perfume' }, is_active: true },
    variant: {
      id: variantId,
      sku: `VAR-${variantId}`,
      attributes: { length: '50ml', lenth: 'exact', Size: 'M', size: 'm' },
      is_active: true,
      is_default: true,
      image: null,
    },
    updated_at: '2026-10-13T21:51:38+00:00',
  }
}

export function rawResponse(data: unknown[] = [rawStock()], page = 1, lastPage = 1) {
  return {
    success: true,
    message: 'ok',
    data,
    meta: { current_page: page, last_page: lastPage, per_page: 15, total: 30, low_stock_threshold: 5 },
  }
}

export function inventoryPage(page = 1, lastPage = 1, warehouseId = 6) {
  return parseInventoryResponse(rawResponse([rawStock(page === 1 ? 172 : 173, warehouseId)], page, lastPage))
}

export function warehouseFixture(id = 6) {
  return {
    id,
    name: `Warehouse ${id}`,
    isActive: id !== 8,
    createdAt: '',
    updatedAt: '',
    cities: [{ id: 2, name: { en: 'Riyadh', ar: 'الرياض' } }],
  }
}

export function warehouseListPage(ids = [6], page = 1, lastPage = 1) {
  return {
    items: ids.map((id) => warehouseFixture(id)),
    paginate: {
      current_page: page,
      total_pages: lastPage,
      per_page: 15,
      total: lastPage === 1 ? ids.length : 16,
      count: ids.length,
      next_page_url: page < lastPage ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}
