import type { Coordinate } from '@/components/form'
import type { LocalizedName } from '@/modules/regions/types/region.types'

export function getLocalizedName(name: LocalizedName, language: string) {
  const primary = language.startsWith('ar') ? name.ar : name.en
  const fallback = language.startsWith('ar') ? name.en : name.ar
  return primary.trim() || fallback.trim()
}

function sameCoordinate(left: Coordinate, right: Coordinate) {
  return left.lat === right.lat && left.lng === right.lng
}

export function getLogicalBoundaryPointCount(boundary: Coordinate[] | null) {
  if (!boundary?.length) return 0
  return boundary.length > 1 && sameCoordinate(boundary[0], boundary.at(-1)!) ? boundary.length - 1 : boundary.length
}

export function closeBoundaryRing(boundary: Coordinate[]) {
  const cloned = boundary.map((point) => ({ ...point }))
  if (cloned.length > 0 && !sameCoordinate(cloned[0], cloned.at(-1)!)) cloned.push({ ...cloned[0] })
  return cloned
}
