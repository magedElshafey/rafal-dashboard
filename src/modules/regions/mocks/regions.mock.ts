import type {
  DeleteRegionResponse,
  RawRegionResponse,
  Region,
  RegionPayload,
  RegionsIndexResponse,
} from '@/modules/regions/types/region.types'

const REGION_NAMES = [
  ['منطقة الرياض', 'Riyadh Region', 'RUH'],
  ['منطقة مكة المكرمة', 'Makkah Region', 'MKC'],
  ['المنطقة الشرقية', 'Eastern Region', 'DMM'],
  ['منطقة المدينة المنورة', 'Madinah Region', 'MED'],
  ['منطقة القصيم', 'Qassim Region', 'QSM'],
  ['منطقة الحدود الشمالية', 'Northern Borders Region', 'AJF'],
  ['منطقة جازان', 'Jazan Region', 'JZN'],
  ['منطقة عسير', 'Asir Region', 'ABS'],
  ['منطقة تبوك', 'Tabuk Region', 'TBK'],
  ['منطقة حائل', "Ha'il Region", 'HAL'],
  ['منطقة الباحة', 'Al-Baha Region', 'BHA'],
  ['منطقة نجران', 'Najran Region', 'NJN'],
  ['المنطقة المحايدة', 'Neutral Zone', 'NZ'],
] as const

const INITIAL_REGIONS: Region[] = REGION_NAMES.map(([ar, en, code], index) => ({
  id: index + 1,
  name: { ar, en },
  code,
  is_active: index !== 8,
  sort_order: index + 1,
  cities_count: (index % 5) + 1,
  created_at: '2026-09-17T18:09:21+00:00',
  updated_at: '2026-09-17T18:09:21+00:00',
}))

let regions = INITIAL_REGIONS.map(cloneRegion)
let nextId = 14
const PAGE_SIZE = 15
const LATENCY = 180

function cloneRegion(region: Region): Region {
  return { ...region, name: { ...region.name } }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

export function resetRegionsMock() {
  regions = INITIAL_REGIONS.map(cloneRegion)
  nextId = 14
}

export function seedRegionsMock(nextRegions: Region[]) {
  regions = nextRegions.map(cloneRegion)
  nextId = Math.max(0, ...regions.map((region) => region.id)) + 1
}

export const regionsMockTransport = {
  async list(page: number): Promise<RegionsIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Regions retrieved successfully',
      data: regions.slice(start, start + PAGE_SIZE).map(cloneRegion),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(regions.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: regions.length,
      },
    }
  },
  async create(payload: RegionPayload): Promise<RawRegionResponse> {
    await wait()
    const now = new Date().toISOString()
    const region: Region = {
      id: nextId++,
      name: { ...payload.name },
      code: payload.code ?? null,
      is_active: payload.isActive,
      sort_order: payload.sortOrder ?? 0,
      cities_count: 0,
      created_at: now,
      updated_at: now,
    }
    regions.unshift(region)
    const { cities_count: _citiesCount, ...responseRegion } = cloneRegion(region)
    return { success: true, message: 'Region created successfully', data: responseRegion }
  },
  async update(id: number, payload: RegionPayload): Promise<RawRegionResponse> {
    await wait()
    const index = regions.findIndex((region) => region.id === id)
    if (index < 0) throw new Error('Region not found')
    regions[index] = {
      ...regions[index],
      name: { ...payload.name },
      code: payload.code ?? regions[index].code,
      sort_order: payload.sortOrder ?? regions[index].sort_order,
      is_active: payload.isActive,
      updated_at: new Date().toISOString(),
    }
    return { success: true, message: 'Region updated successfully', data: cloneRegion(regions[index]) }
  },
  async delete(id: number): Promise<DeleteRegionResponse> {
    await wait()
    regions = regions.filter((region) => region.id !== id)
    return { success: true, message: 'Region deleted successfully' }
  },
}
