import type { Coordinate } from '@/types/geo.types'

export type LocationMapMode = 'idle' | 'center' | 'draw' | 'edit'

export type LocationMapCanvasProps = {
  boundary: Coordinate[]
  center: Coordinate | null
  disabled: boolean
  mode: LocationMapMode
  fitRequestKey: number
  styleUrl: string
  onBoundaryChange: (boundary: Coordinate[]) => void
  onCenterChange: (center: Coordinate) => void
  onBoundaryComplete: () => void
  onReady: () => void
  onError: () => void
}

export type LocationMapEditorLabels = {
  map: string
  mapLoading: string
  mapFailed: string
  retryMap: string
  setCenter: string
  changeCenter: string
  clearCenter: string
  drawBoundary: string
  editBoundary: string
  redrawBoundary: string
  clearBoundary: string
  fitCoverage: string
  centerSelected: string
  noCenterSelected: string
  boundaryDefined: (count: number) => string
  noBoundaryDefined: string
  advancedCoordinates: string
  advancedDescription: string
}
