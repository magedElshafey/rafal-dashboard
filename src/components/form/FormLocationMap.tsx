import { useState } from 'react'
import { useController, useFormContext, type FieldError, type FieldErrors, type FieldValues } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'

import { LocationMapEditor } from '@/components/map'
import type { LocationMapEditorLabels } from '@/components/map/location-map.types'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Coordinate } from '@/types/geo.types'
import { LocationBoundaryEditor, type LocationBoundaryEditorLabels } from './LocationBoundaryEditor'

type LocationFormValues = FieldValues & {
  boundary: Coordinate[]
  center: Coordinate | null
}

type Props = {
  mapLabels: LocationMapEditorLabels
  advancedLabels: LocationBoundaryEditorLabels
  styleUrl: string
  resetValuesKey: string | number
  disabled?: boolean
}

function firstErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const message = (error as FieldError).message
  if (typeof message === 'string') return message
  for (const value of Object.values(error)) {
    const nested = firstErrorMessage(value)
    if (nested) return nested
  }
  return undefined
}

export function FormLocationMap({ mapLabels, advancedLabels, styleUrl, resetValuesKey, disabled = false }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { control, formState } = useFormContext<LocationFormValues>()
  const { field: boundary } = useController({ control, name: 'boundary' })
  const { field: center } = useController({ control, name: 'center' })
  const errors = formState.errors as FieldErrors<LocationFormValues>
  const boundaryError = firstErrorMessage(errors.boundary)
  const centerError = firstErrorMessage(errors.center)

  return (
    <div className="space-y-4">
      <LocationMapEditor
        key={resetValuesKey}
        boundary={boundary.value}
        center={center.value}
        onBoundaryChange={boundary.onChange}
        onCenterChange={center.onChange}
        boundaryError={boundaryError}
        centerError={centerError}
        disabled={disabled}
        styleUrl={styleUrl}
        labels={mapLabels}
      />

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-w-0 w-full justify-between whitespace-normal"
            disabled={disabled}
          >
            <span className="min-w-0 text-start">
              <span className="block">{mapLabels.advancedCoordinates}</span>
              <span className="block text-xs font-normal text-muted-foreground">{mapLabels.advancedDescription}</span>
            </span>
            <ChevronDown aria-hidden="true" className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <LocationBoundaryEditor
            boundary={boundary.value}
            center={center.value}
            onBoundaryChange={boundary.onChange}
            onCenterChange={center.onChange}
            boundaryError={boundaryError}
            centerError={centerError}
            disabled={disabled}
            labels={advancedLabels}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
