import type {
  DeleteWarehouseResponse,
  Warehouse,
  WarehousePayload,
  WarehouseResponse,
  WarehousesIndexResponse,
} from '@/modules/warehouses/types/warehouse.types'

const INITIAL_WAREHOUSES: Warehouse[] = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  name: index === 0 ? 'Test Warehouse' : `Warehouse ${index + 1}`,
  coverage_zone: index === 0 ? ['جدة', 'مكة المكرمة', 'Jeddah', 'Makkah'] : [`منطقة ${index + 1}`, `Zone ${index + 1}`],
  is_active: index % 4 !== 3,
  created_at: '2026-09-10T16:27:42+00:00',
  updated_at: '2026-09-10T16:27:42+00:00',
}))

let warehouses = INITIAL_WAREHOUSES.map(cloneWarehouse)
let nextId = 19
const PAGE_SIZE = 15
const LATENCY = 180

function cloneWarehouse(warehouse: Warehouse): Warehouse {
  return { ...warehouse, coverage_zone: [...warehouse.coverage_zone] }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

export function resetWarehousesMock() {
  warehouses = INITIAL_WAREHOUSES.map(cloneWarehouse)
  nextId = 19
}

export function seedWarehousesMock(items: Warehouse[]) {
  warehouses = items.map(cloneWarehouse)
  nextId = Math.max(0, ...warehouses.map((item) => item.id)) + 1
}

export const warehousesMockTransport = {
  async list(page: number): Promise<WarehousesIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Warehouses retrieved successfully',
      data: warehouses.slice(start, start + PAGE_SIZE).map(cloneWarehouse),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(warehouses.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: warehouses.length,
      },
    }
  },
  async show(id: number): Promise<WarehouseResponse> {
    await wait()
    const warehouse = warehouses.find((item) => item.id === id)
    if (!warehouse) throw new Error('Warehouse not found')
    return { success: true, message: 'Warehouse retrieved successfully', data: cloneWarehouse(warehouse) }
  },
  async create(payload: WarehousePayload): Promise<WarehouseResponse> {
    await wait()
    const now = new Date().toISOString()
    const warehouse: Warehouse = {
      id: nextId++,
      name: payload.name,
      coverage_zone: [...payload.coverageZone],
      is_active: payload.isActive,
      created_at: now,
      updated_at: now,
    }
    warehouses.unshift(warehouse)
    return { success: true, message: 'Warehouse created successfully', data: cloneWarehouse(warehouse) }
  },
  async update(id: number, payload: WarehousePayload): Promise<WarehouseResponse> {
    await wait()
    const index = warehouses.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Warehouse not found')
    warehouses[index] = {
      ...warehouses[index],
      name: payload.name,
      coverage_zone: [...payload.coverageZone],
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    }
    return { success: true, message: 'Warehouse updated successfully', data: cloneWarehouse(warehouses[index]) }
  },
  async delete(id: number): Promise<DeleteWarehouseResponse> {
    await wait()
    warehouses = warehouses.filter((item) => item.id !== id)
    return { success: true, message: 'Warehouse deleted successfully' }
  },
}
