import { describe, expect, it } from 'vitest'

import { coordinatesToPolygonFeature, polygonFeatureToCoordinates } from './geojson.utils'

describe('map GeoJSON conversion', () => {
  it('converts domain latitude/longitude to a closed GeoJSON longitude/latitude ring without mutation', () => {
    const boundary = [
      { lat: 24.7, lng: 46.6 },
      { lat: 24.8, lng: 46.8 },
      { lat: 24.6, lng: 46.9 },
    ]

    expect(coordinatesToPolygonFeature(boundary, 'boundary')).toEqual({
      type: 'Feature',
      id: 'boundary',
      properties: { mode: 'polygon' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [46.6, 24.7],
            [46.8, 24.8],
            [46.9, 24.6],
            [46.6, 24.7],
          ],
        ],
      },
    })
    expect(boundary).toHaveLength(3)
  })

  it('strips only the GeoJSON closing position when converting back to domain coordinates', () => {
    const feature = coordinatesToPolygonFeature([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ])
    const originalFeature = structuredClone(feature)

    expect(polygonFeatureToCoordinates(feature)).toEqual([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ])
    expect(feature).toEqual(originalFeature)
  })
})
