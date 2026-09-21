import type {
  City,
  CityPayload,
  CityResponse,
  CityUpdatePayload,
  CitiesIndexResponse,
  DeleteCityResponse,
  RegionSummary,
} from '@/modules/cities/types/city.types'
import { closeBoundaryRing } from '@/modules/cities/utils/city.utils'

const REGIONS: RegionSummary[] = [
  { id: 1, name: { ar: 'منطقة الرياض', en: 'Riyadh Region' } },
  { id: 2, name: { ar: 'منطقة مكة المكرمة', en: 'Makkah Region' } },
  { id: 3, name: { ar: 'المنطقة الشرقية', en: 'Eastern Region' } },
  { id: 4, name: { ar: 'منطقة المدينة المنورة', en: 'Madinah Region' } },
  { id: 5, name: { ar: 'منطقة القصيم', en: 'Qassim Region' } },
  { id: 6, name: { ar: 'منطقة الحدود الشمالية', en: 'Northern Borders Region' } },
  { id: 7, name: { ar: 'منطقة جازان', en: 'Jazan Region' } },
  { id: 8, name: { ar: 'منطقة عسير', en: 'Asir Region' } },
  { id: 9, name: { ar: 'منطقة تبوك', en: 'Tabuk Region' } },
  { id: 10, name: { ar: 'منطقة حائل', en: "Ha'il Region" } },
  { id: 11, name: { ar: 'منطقة الباحة', en: 'Al-Baha Region' } },
  { id: 12, name: { ar: 'منطقة نجران', en: 'Najran Region' } },
  { id: 13, name: { ar: 'الجزيرة المحايدة', en: 'Neutral Zone' } },
]

const CITY_NAMES: ReadonlyArray<readonly [string, string, number]> = [
  ['الرياض', 'Riyadh', 1],
  ['الدرعية', 'Diriyah', 1],
  ['جدة', 'Jeddah', 2],
  ['مكة', 'Makkah', 2],
  ['الدمام', 'Dammam', 3],
  ['الخبر', 'Khobar', 3],
  ['المدينة المنورة', 'Madinah', 4],
  ['ينبع', 'Yanbu', 4],
  ['بريدة', 'Buraydah', 5],
  ['عنيزة', 'Unaizah', 5],
  ['عرعر', 'Arar', 6],
  ['رفحاء', 'Rafha', 6],
  ['جازان', 'Jazan', 7],
  ['صبيا', 'Sabya', 7],
  ['أبها', 'Abha', 8],
  ['خميس مشيط', 'Khamis Mushait', 8],
  ['تبوك', 'Tabuk', 9],
  ['ضباء', 'Duba', 9],
  ['حائل', "Ha'il", 10],
  ['بقعاء', 'Baqaa', 10],
  ['الباحة', 'Al-Baha', 11],
  ['بلجرشي', 'Baljurashi', 11],
  ['نجران', 'Najran', 12],
  ['شرورة', 'Sharurah', 12],
  ['الجبيل', 'Jubail', 3],
  ['القطيف', 'Qatif', 3],
  ['الطائف', 'Taif', 2],
  ['المجمعة', 'Al Majmaah', 1],
  ['الخرج', 'Al Kharj', 1],
  ['بيشة', 'Bisha', 8],
  ['الخفجي', 'Khafji', 13],
]

const INITIAL_CITIES: City[] = CITY_NAMES.map(([ar, en, regionId], index) => {
  const region = REGIONS.find((item) => item.id === regionId)!
  const hasGeometry = index === 1
  return {
    id: index + 1,
    region_id: regionId,
    region: { id: region.id, name: { ...region.name } },
    name: { ar, en },
    boundary: hasGeometry
      ? closeBoundaryRing([
          { lat: 24.6, lng: 46.5 },
          { lat: 24.6, lng: 46.9 },
          { lat: 24.9, lng: 46.9 },
          { lat: 24.9, lng: 46.5 },
        ])
      : null,
    center: hasGeometry ? { lat: 24.75, lng: 46.7 } : null,
    is_active: index !== 3,
    sort_order: index + 1,
    created_at: '2026-09-17T18:09:23+00:00',
    updated_at: '2026-09-17T18:09:23+00:00',
  }
})

let cities = INITIAL_CITIES.map(cloneCity)
let nextId = 32
const PAGE_SIZE = 15
const LATENCY = 180

function cloneCity(city: City): City {
  return {
    ...city,
    name: { ...city.name },
    region: { ...city.region, name: { ...city.region.name } },
    boundary: city.boundary?.map((point) => ({ ...point })) ?? null,
    center: city.center ? { ...city.center } : null,
  }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

export function resetCitiesMock() {
  cities = INITIAL_CITIES.map(cloneCity)
  nextId = 32
}

export function seedCitiesMock(nextCities: City[]) {
  cities = nextCities.map(cloneCity)
  nextId = Math.max(0, ...cities.map((city) => city.id)) + 1
}

export const citiesMockTransport = {
  async list(page: number): Promise<CitiesIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    return {
      success: true,
      message: 'Cities retrieved successfully',
      data: cities.slice(start, start + PAGE_SIZE).map(cloneCity),
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(cities.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: cities.length,
      },
    }
  },
  async create(payload: CityPayload): Promise<CityResponse> {
    await wait()
    const region = REGIONS.find((item) => item.id === payload.regionId)
    if (!region) throw new Error('Region not found')
    const now = new Date().toISOString()
    const city: City = {
      id: nextId++,
      region_id: region.id,
      region: { id: region.id, name: { ...region.name } },
      name: { ...payload.name },
      boundary: payload.boundary.length > 0 ? closeBoundaryRing(payload.boundary) : null,
      center: payload.center ? { ...payload.center } : null,
      is_active: payload.isActive,
      sort_order: payload.sortOrder ?? 0,
      created_at: now,
      updated_at: now,
    }
    cities.unshift(city)
    return { success: true, message: 'City created successfully', data: cloneCity(city) }
  },
  async update(id: number, payload: CityUpdatePayload): Promise<CityResponse> {
    await wait()
    const index = cities.findIndex((city) => city.id === id)
    if (index < 0) throw new Error('City not found')
    const current = cities[index]
    const region =
      payload.regionId === undefined ? current.region : REGIONS.find((item) => item.id === payload.regionId)
    if (!region) throw new Error('Region not found')
    const updated: City = {
      ...current,
      region_id: payload.regionId ?? current.region_id,
      region: { id: region.id, name: { ...region.name } },
      name: {
        ar: payload.nameAr === undefined ? current.name.ar : payload.nameAr.trim(),
        en: payload.nameEn === undefined ? current.name.en : payload.nameEn.trim(),
      },
      is_active: payload.isActive ?? current.is_active,
      sort_order: payload.sortOrder ?? current.sort_order,
      center: payload.center === undefined ? current.center : { ...payload.center },
      boundary:
        payload.boundary === undefined
          ? current.boundary
          : closeBoundaryRing(payload.boundary.map((point) => ({ ...point }))),
      updated_at: new Date().toISOString(),
    }
    cities[index] = updated
    return { success: true, message: 'City updated successfully', data: cloneCity(updated) }
  },
  async delete(id: number): Promise<DeleteCityResponse> {
    await wait()
    const index = cities.findIndex((city) => city.id === id)
    if (index < 0) throw new Error('City not found')
    cities.splice(index, 1)
    return { success: true, message: 'City deleted successfully' }
  },
}
