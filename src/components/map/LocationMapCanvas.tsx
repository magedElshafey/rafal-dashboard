import { useEffect, useRef, useState } from 'react'
import { LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl, type MapMouseEvent } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode, type GeoJSONStoreFeatures } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import 'maplibre-gl/dist/maplibre-gl.css'

import { coordinatesToPolygonFeature, polygonFeatureToCoordinates, type PolygonFeature } from './geojson.utils'
import type { LocationMapCanvasProps, LocationMapMode } from './location-map.types'
import { getSaudiArabiaMapOptions, SAUDI_ARABIA_DEFAULT_VIEW } from '@/config/map'
import type { Coordinate } from '@/types/geo.types'

setWorkerUrl(workerUrl)

function isPolygonFeature(feature: GeoJSONStoreFeatures): feature is GeoJSONStoreFeatures & PolygonFeature {
  return feature.geometry.type === 'Polygon' && feature.properties.mode === 'polygon'
}

function sameBoundary(left: readonly Coordinate[], right: readonly Coordinate[]) {
  return (
    left.length === right.length &&
    left.every((coordinate, index) => coordinate.lat === right[index]?.lat && coordinate.lng === right[index]?.lng)
  )
}

function fitMap(map: Map, boundary: readonly Coordinate[], center: Coordinate | null) {
  if (boundary.length > 0) {
    const bounds = boundary.reduce(
      (next, coordinate) => next.extend([coordinate.lng, coordinate.lat]),
      new LngLatBounds([boundary[0].lng, boundary[0].lat], [boundary[0].lng, boundary[0].lat])
    )
    map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 350 })
  } else if (center) {
    map.flyTo({ center: [center.lng, center.lat], zoom: 12, duration: 350 })
  } else {
    map.flyTo({
      center: [...SAUDI_ARABIA_DEFAULT_VIEW.center],
      zoom: SAUDI_ARABIA_DEFAULT_VIEW.zoom,
      duration: 350,
    })
  }
}

export default function LocationMapCanvas({
  boundary,
  center,
  disabled,
  mode,
  fitRequestKey,
  styleUrl,
  onBoundaryChange,
  onCenterChange,
  onBoundaryComplete,
  onReady,
  onError,
}: LocationMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const drawRef = useRef<TerraDraw | null>(null)
  const boundaryIdRef = useRef<string | number | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const readyRef = useRef(false)
  const disabledRef = useRef(disabled)
  const modeRef = useRef<LocationMapMode>(mode)
  const boundaryRef = useRef(boundary)
  const centerRef = useRef(center)
  const callbacksRef = useRef({ onBoundaryChange, onCenterChange, onBoundaryComplete, onReady, onError })
  const [readyVersion, setReadyVersion] = useState(0)

  useEffect(() => {
    modeRef.current = mode
    disabledRef.current = disabled
    boundaryRef.current = boundary
    centerRef.current = center
    callbacksRef.current = { onBoundaryChange, onCenterChange, onBoundaryComplete, onReady, onError }
  }, [boundary, center, mode, onBoundaryChange, onBoundaryComplete, onCenterChange, onError, onReady])

  useEffect(() => {
    if (!containerRef.current) return
    if (!styleUrl) {
      callbacksRef.current.onError()
      return
    }

    const map = new Map({
      container: containerRef.current,
      style: styleUrl,
      ...getSaudiArabiaMapOptions(),
    })
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const handleMapError = () => {
      if (!readyRef.current) callbacksRef.current.onError()
    }
    const handleMapClick = (event: MapMouseEvent) => {
      if (modeRef.current !== 'center' || disabledRef.current) return
      callbacksRef.current.onCenterChange({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    }
    map.on('error', handleMapError)
    map.on('click', handleMapClick)

    map.once('load', () => {
      if (mapRef.current !== map) return
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: false,
                  coordinates: { midpoints: true, draggable: true, deletable: true },
                },
              },
            },
          }),
        ],
      })
      draw.start()
      drawRef.current = draw

      const emitPolygon = () => {
        const polygon = draw.getSnapshot().find(isPolygonFeature)
        if (!polygon) return
        const nextBoundary = polygonFeatureToCoordinates(polygon)
        boundaryIdRef.current = polygon.id ?? null
        if (!sameBoundary(nextBoundary, boundaryRef.current)) callbacksRef.current.onBoundaryChange(nextBoundary)
      }
      const handleFinish = () => {
        emitPolygon()
        callbacksRef.current.onBoundaryComplete()
      }
      const handleChange = () => {
        if (modeRef.current === 'edit') emitPolygon()
      }
      draw.on('finish', handleFinish)
      draw.on('change', handleChange)

      readyRef.current = true
      setReadyVersion((version) => version + 1)
      callbacksRef.current.onReady()
      fitMap(map, boundaryRef.current, centerRef.current)
    })

    return () => {
      readyRef.current = false
      markerRef.current?.remove()
      markerRef.current = null
      drawRef.current?.stop()
      drawRef.current = null
      map.off('click', handleMapClick)
      map.off('error', handleMapError)
      map.remove()
      mapRef.current = null
    }
  }, [styleUrl])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    markerRef.current?.remove()
    markerRef.current = null
    if (!center) return
    const marker = new Marker({ draggable: !disabled, color: '#2563eb' }).setLngLat([center.lng, center.lat]).addTo(map)
    marker.on('dragend', () => {
      const position = marker.getLngLat()
      callbacksRef.current.onCenterChange({ lat: position.lat, lng: position.lng })
    })
    markerRef.current = marker
    return () => {
      marker.remove()
    }
  }, [center, disabled, readyVersion])

  useEffect(() => {
    const draw = drawRef.current
    if (!draw || !readyRef.current) return
    const existing = draw.getSnapshot().find(isPolygonFeature)
    if (boundary.length < 3) {
      if (existing?.id !== undefined) draw.removeFeatures([existing.id])
      boundaryIdRef.current = null
      return
    }
    const existingBoundary = existing ? polygonFeatureToCoordinates(existing) : []
    if (existing && sameBoundary(existingBoundary, boundary)) {
      boundaryIdRef.current = existing.id ?? null
      return
    }
    if (existing?.id !== undefined) draw.removeFeatures([existing.id])
    const feature = coordinatesToPolygonFeature(boundary, 'location-boundary')
    const [result] = draw.addFeatures([feature])
    if (result?.valid) boundaryIdRef.current = feature.id ?? null
  }, [boundary, readyVersion])

  useEffect(() => {
    const draw = drawRef.current
    if (!draw || !readyRef.current) return
    if (disabled) {
      draw.setMode('select')
      return
    }
    if (mode === 'draw') {
      const existingIds = draw
        .getSnapshot()
        .filter(isPolygonFeature)
        .flatMap((feature) => (feature.id === undefined ? [] : [feature.id]))
      if (existingIds.length) draw.removeFeatures(existingIds)
      boundaryIdRef.current = null
      draw.setMode('polygon')
      return
    }
    draw.setMode('select')
    if (mode === 'edit' && boundaryIdRef.current !== null) draw.selectFeature(boundaryIdRef.current)
  }, [disabled, mode, readyVersion])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || fitRequestKey === 0) return
    fitMap(map, boundary, center)
  }, [boundary, center, fitRequestKey, readyVersion])

  return <div ref={containerRef} className="h-full w-full" data-testid="location-map-canvas" />
}
