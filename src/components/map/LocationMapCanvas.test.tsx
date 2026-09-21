import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { getSaudiArabiaMapOptions } from '@/config/map'

const mapMocks = vi.hoisted(() => {
  const instance = {
    addControl: vi.fn(),
    on: vi.fn(),
    once: vi.fn((_event: string, callback: () => void) => callback()),
    off: vi.fn(),
    remove: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
  }
  const draw = {
    start: vi.fn(),
    stop: vi.fn(),
    on: vi.fn(),
    getSnapshot: vi.fn(() => []),
    setMode: vi.fn(),
  }
  return {
    draw,
    instance,
    constructor: vi.fn(function MapConstructor() {
      return instance
    }),
  }
})

vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '/map-worker.js' }))
vi.mock('maplibre-gl', () => ({
  Map: mapMocks.constructor,
  Marker: vi.fn(),
  NavigationControl: vi.fn(),
  LngLatBounds: vi.fn(),
  setWorkerUrl: vi.fn(),
}))
vi.mock('terra-draw', () => ({
  TerraDraw: vi.fn(function TerraDrawConstructor() {
    return mapMocks.draw
  }),
  TerraDrawPolygonMode: vi.fn(),
  TerraDrawSelectMode: vi.fn(),
}))
vi.mock('terra-draw-maplibre-gl-adapter', () => ({ TerraDrawMapLibreGLAdapter: vi.fn() }))

import LocationMapCanvas from './LocationMapCanvas'

describe('LocationMapCanvas configuration', () => {
  it('passes centralized Saudi navigation constraints to MapLibre initialization', async () => {
    render(
      <LocationMapCanvas
        boundary={[]}
        center={null}
        disabled={false}
        mode="idle"
        fitRequestKey={0}
        styleUrl="https://maps.example/style.json"
        onBoundaryChange={vi.fn()}
        onCenterChange={vi.fn()}
        onBoundaryComplete={vi.fn()}
        onReady={vi.fn()}
        onError={vi.fn()}
      />
    )

    await waitFor(() => expect(mapMocks.constructor).toHaveBeenCalledTimes(1))
    expect(mapMocks.constructor).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'https://maps.example/style.json',
        ...getSaudiArabiaMapOptions(),
      })
    )
    expect(mapMocks.instance.flyTo).toHaveBeenCalledWith({
      center: [...getSaudiArabiaMapOptions().center],
      zoom: getSaudiArabiaMapOptions().zoom,
      duration: 350,
    })
    expect(mapMocks.instance.flyTo.mock.calls[0][0]).not.toHaveProperty('maxBounds')
    expect(mapMocks.instance.flyTo.mock.calls[0][0]).not.toHaveProperty('minZoom')
    expect(mapMocks.instance.flyTo.mock.calls[0][0]).not.toHaveProperty('renderWorldCopies')
  })
})
