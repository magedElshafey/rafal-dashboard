import { ArrowDown, ArrowUp, MapPin, Plus, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type Coordinate = { lat: number; lng: number }

export type LocationBoundaryEditorLabels = {
  boundary: string
  boundaryDescription: string
  center: string
  centerDescription: string
  point: (index: number) => string
  latitude: string
  longitude: string
  addPoint: string
  removePoint: (index: number) => string
  movePointUp: (index: number) => string
  movePointDown: (index: number) => string
  clearBoundary: string
  setCenter: string
  clearCenter: string
  noBoundary: string
  noCenter: string
}

type Props = {
  boundary: Coordinate[]
  center: Coordinate | null
  onBoundaryChange: (boundary: Coordinate[]) => void
  onCenterChange: (center: Coordinate | null) => void
  labels: LocationBoundaryEditorLabels
  boundaryError?: string
  centerError?: string
  disabled?: boolean
}

function toInputValue(value: number) {
  return Number.isFinite(value) ? value : ''
}

function toNumber(value: string) {
  return value === '' ? Number.NaN : Number(value)
}

export function LocationBoundaryEditor({
  boundary,
  center,
  onBoundaryChange,
  onCenterChange,
  labels,
  boundaryError,
  centerError,
  disabled = false,
}: Props) {
  const updatePoint = (index: number, key: keyof Coordinate, value: string) => {
    const next = boundary.map((point, pointIndex) =>
      pointIndex === index ? { ...point, [key]: toNumber(value) } : point
    )
    onBoundaryChange(next)
  }
  const movePoint = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= boundary.length) return
    const next = [...boundary]
    ;[next[index], next[target]] = [next[target], next[index]]
    onBoundaryChange(next)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4" aria-labelledby="boundary-editor-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="boundary-editor-title" className="font-medium text-foreground">
              {labels.boundary}
            </h3>
            <p className="text-sm text-muted-foreground">{labels.boundaryDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {boundary.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onBoundaryChange([])}
              >
                <X aria-hidden="true" />
                {labels.clearBoundary}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onBoundaryChange([...boundary, { lat: 0, lng: 0 }])}
            >
              <Plus aria-hidden="true" />
              {labels.addPoint}
            </Button>
          </div>
        </div>

        {boundary.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            {labels.noBoundary}
          </p>
        ) : (
          <ol className="space-y-3">
            {boundary.map((point, index) => (
              <li key={index} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{labels.point(index + 1)}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={disabled || index === 0}
                      aria-label={labels.movePointUp(index + 1)}
                      onClick={() => movePoint(index, -1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={disabled || index === boundary.length - 1}
                      aria-label={labels.movePointDown(index + 1)}
                      onClick={() => movePoint(index, 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      disabled={disabled}
                      aria-label={labels.removePoint(index + 1)}
                      onClick={() => onBoundaryChange(boundary.filter((_, pointIndex) => pointIndex !== index))}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-foreground">
                    <span>{labels.latitude}</span>
                    <Input
                      type="number"
                      dir="ltr"
                      step="any"
                      min={-90}
                      max={90}
                      value={toInputValue(point.lat)}
                      disabled={disabled}
                      aria-invalid={Boolean(boundaryError)}
                      onChange={(event) => updatePoint(index, 'lat', event.target.value)}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-foreground">
                    <span>{labels.longitude}</span>
                    <Input
                      type="number"
                      dir="ltr"
                      step="any"
                      min={-180}
                      max={180}
                      value={toInputValue(point.lng)}
                      disabled={disabled}
                      aria-invalid={Boolean(boundaryError)}
                      onChange={(event) => updatePoint(index, 'lng', event.target.value)}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ol>
        )}
        {boundaryError ? (
          <p role="alert" className="text-sm text-destructive">
            {boundaryError}
          </p>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-border pt-6" aria-labelledby="center-editor-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="center-editor-title" className="font-medium text-foreground">
              {labels.center}
            </h3>
            <p className="text-sm text-muted-foreground">{labels.centerDescription}</p>
          </div>
          {center ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onCenterChange(null)}
            >
              <X aria-hidden="true" />
              {labels.clearCenter}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onCenterChange({ lat: 0, lng: 0 })}
            >
              <MapPin aria-hidden="true" />
              {labels.setCenter}
            </Button>
          )}
        </div>
        {center ? (
          <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-foreground">
              <span>{labels.latitude}</span>
              <Input
                type="number"
                dir="ltr"
                step="any"
                min={-90}
                max={90}
                value={toInputValue(center.lat)}
                disabled={disabled}
                aria-invalid={Boolean(centerError)}
                onChange={(event) => onCenterChange({ ...center, lat: toNumber(event.target.value) })}
              />
            </label>
            <label className="space-y-2 text-sm text-foreground">
              <span>{labels.longitude}</span>
              <Input
                type="number"
                dir="ltr"
                step="any"
                min={-180}
                max={180}
                value={toInputValue(center.lng)}
                disabled={disabled}
                aria-invalid={Boolean(centerError)}
                onChange={(event) => onCenterChange({ ...center, lng: toNumber(event.target.value) })}
              />
            </label>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            {labels.noCenter}
          </p>
        )}
        {centerError ? (
          <p role="alert" className="text-sm text-destructive">
            {centerError}
          </p>
        ) : null}
      </section>
    </div>
  )
}
