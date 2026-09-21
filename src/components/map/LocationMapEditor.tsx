import { lazy, Suspense, useEffect, useState } from 'react'
import { Edit3, Focus, LocateFixed, MapPinned, Pencil, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Coordinate } from '@/types/geo.types'
import type { LocationMapEditorLabels, LocationMapMode } from './location-map.types'

const LocationMapCanvas = lazy(() => import('./LocationMapCanvas'))

type Props = {
  boundary: Coordinate[]
  center: Coordinate | null
  onBoundaryChange: (boundary: Coordinate[]) => void
  onCenterChange: (center: Coordinate | null) => void
  labels: LocationMapEditorLabels
  styleUrl: string
  disabled?: boolean
  boundaryError?: string
  centerError?: string
}

function MapLoading({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-surface/90" role="status" aria-busy="true">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto size-10 rounded-full" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export function LocationMapEditor({
  boundary,
  center,
  onBoundaryChange,
  onCenterChange,
  labels,
  styleUrl,
  disabled = false,
  boundaryError,
  centerError,
}: Props) {
  const [mode, setMode] = useState<LocationMapMode>('idle')
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const [fitRequestKey, setFitRequestKey] = useState(0)

  useEffect(() => {
    if (disabled) setMode('idle')
  }, [disabled])

  const retryMap = () => {
    setMapFailed(false)
    setMapReady(false)
    setMode('idle')
    setMapKey((key) => key + 1)
  }
  const redrawBoundary = () => {
    onBoundaryChange([])
    setMode('draw')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label={labels.map}>
        <Button
          type="button"
          variant={mode === 'center' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled || mapFailed}
          onClick={() => setMode('center')}
        >
          <LocateFixed aria-hidden="true" />
          {center ? labels.changeCenter : labels.setCenter}
        </Button>
        {boundary.length > 0 ? (
          <>
            <Button
              type="button"
              variant={mode === 'edit' ? 'default' : 'outline'}
              size="sm"
              disabled={disabled || mapFailed}
              onClick={() => setMode('edit')}
            >
              <Edit3 aria-hidden="true" />
              {labels.editBoundary}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled || mapFailed} onClick={redrawBoundary}>
              <RotateCcw aria-hidden="true" />
              {labels.redrawBoundary}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant={mode === 'draw' ? 'default' : 'outline'}
            size="sm"
            disabled={disabled || mapFailed}
            onClick={() => setMode('draw')}
          >
            <Pencil aria-hidden="true" />
            {labels.drawBoundary}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || mapFailed}
          onClick={() => setFitRequestKey((key) => key + 1)}
        >
          <Focus aria-hidden="true" />
          {labels.fitCoverage}
        </Button>
      </div>

      <div
        className="relative h-[420px] min-h-[420px] overflow-hidden rounded-2xl border border-border bg-black-50 sm:h-[480px] sm:min-h-[480px]"
        aria-label={labels.map}
      >
        {!mapReady && !mapFailed ? <MapLoading label={labels.mapLoading} /> : null}
        {mapFailed ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-surface p-6 text-center" role="alert">
            <div className="max-w-sm space-y-4">
              <MapPinned aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
              <p className="text-sm text-foreground">{labels.mapFailed}</p>
              <Button type="button" variant="outline" disabled={disabled} onClick={retryMap}>
                {labels.retryMap}
              </Button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<MapLoading label={labels.mapLoading} />}>
            <LocationMapCanvas
              key={mapKey}
              boundary={boundary}
              center={center}
              disabled={disabled}
              mode={mode}
              fitRequestKey={fitRequestKey}
              styleUrl={styleUrl}
              onCenterChange={(coordinate) => {
                onCenterChange(coordinate)
                setMode('idle')
              }}
              onBoundaryChange={onBoundaryChange}
              onBoundaryComplete={() => setMode('edit')}
              onReady={() => setMapReady(true)}
              onError={() => setMapFailed(true)}
            />
          </Suspense>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{labels.centerSelected}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">
                {center ? `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}` : labels.noCenterSelected}
              </p>
            </div>
            {center ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                disabled={disabled}
                aria-label={labels.clearCenter}
                onClick={() => {
                  onCenterChange(null)
                  setMode('idle')
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          {centerError ? <p className="mt-2 text-sm text-destructive">{centerError}</p> : null}
        </div>
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {boundary.length > 0 ? labels.boundaryDefined(boundary.length) : labels.noBoundaryDefined}
              </p>
            </div>
            {boundary.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                disabled={disabled}
                aria-label={labels.clearBoundary}
                onClick={() => {
                  onBoundaryChange([])
                  setMode('idle')
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          {boundaryError ? <p className="mt-2 text-sm text-destructive">{boundaryError}</p> : null}
        </div>
      </div>
    </div>
  )
}
