import type { Coordinate } from '@/types/geo.types'

export type PolygonFeature = {
  type: 'Feature'
  id?: string | number
  properties: { mode: 'polygon' }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

function samePosition(left: readonly number[], right: readonly number[]) {
  return left[0] === right[0] && left[1] === right[1]
}

export function coordinatesToPolygonFeature(boundary: readonly Coordinate[], id?: string | number): PolygonFeature {
  const ring = boundary.map(({ lat, lng }) => [lng, lat])
  if (ring.length > 0 && !samePosition(ring[0], ring.at(-1)!)) ring.push([...ring[0]])
  return {
    type: 'Feature',
    ...(id === undefined ? {} : { id }),
    properties: { mode: 'polygon' },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

export function polygonFeatureToCoordinates(feature: Pick<PolygonFeature, 'geometry'>): Coordinate[] {
  const ring = feature.geometry.coordinates[0]?.map(([lng, lat]) => ({ lat, lng })) ?? []
  if (ring.length > 1 && ring[0].lat === ring.at(-1)!.lat && ring[0].lng === ring.at(-1)!.lng) {
    ring.pop()
  }
  return ring
}
