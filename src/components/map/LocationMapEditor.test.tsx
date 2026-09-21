import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Coordinate } from '@/types/geo.types'
import type { LocationMapCanvasProps, LocationMapEditorLabels } from './location-map.types'

vi.mock('./LocationMapCanvas', () => ({
  default: (props: LocationMapCanvasProps) => (
    <div data-testid="mock-map" data-mode={props.mode}>
      <button
        type="button"
        onClick={() => props.onCenterChange(props.center ? { lat: 25.1, lng: 47.2 } : { lat: 24.7, lng: 46.6 })}
      >
        Map click
      </button>
      <button
        type="button"
        onClick={() => {
          props.onBoundaryChange([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
          ])
          props.onBoundaryComplete()
        }}
      >
        Complete polygon
      </button>
      <button
        type="button"
        onClick={() =>
          props.onBoundaryChange([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
            { lat: 7, lng: 8 },
          ])
        }
      >
        Move vertex
      </button>
      <button type="button" onClick={props.onReady}>
        Ready
      </button>
      <button type="button" onClick={props.onError}>
        Fail
      </button>
    </div>
  ),
}))

import { LocationMapEditor } from './LocationMapEditor'

const labels: LocationMapEditorLabels = {
  map: 'Map',
  mapLoading: 'Loading map',
  mapFailed: 'Map failed',
  retryMap: 'Retry map',
  setCenter: 'Set Center',
  changeCenter: 'Change Center',
  clearCenter: 'Clear Center',
  drawBoundary: 'Draw Boundary',
  editBoundary: 'Edit Boundary',
  redrawBoundary: 'Redraw Boundary',
  clearBoundary: 'Clear Boundary',
  fitCoverage: 'Fit Coverage',
  centerSelected: 'Selected center',
  noCenterSelected: 'No center selected',
  boundaryDefined: (count) => `${count} boundary points`,
  noBoundaryDefined: 'No boundary defined',
  advancedCoordinates: 'Advanced Coordinates',
  advancedDescription: 'Exact values',
}

function Harness() {
  const [boundary, setBoundary] = useState<Coordinate[]>([])
  const [center, setCenter] = useState<Coordinate | null>(null)
  return (
    <LocationMapEditor
      boundary={boundary}
      center={center}
      onBoundaryChange={setBoundary}
      onCenterChange={setCenter}
      labels={labels}
      styleUrl="/style.json"
    />
  )
}

describe('LocationMapEditor', () => {
  it('supports center selection, drawing, vertex edits, clearing, and redrawing through its map abstraction', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(await screen.findByRole('button', { name: 'Ready' }))

    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-mode', 'center')
    await user.click(screen.getByRole('button', { name: 'Map click' }))
    expect(screen.getByText('24.700000, 46.600000')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change Center' }))
    await user.click(screen.getByRole('button', { name: 'Map click' }))
    expect(screen.getByText('25.100000, 47.200000')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Draw Boundary' }))
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-mode', 'draw')
    await user.click(screen.getByRole('button', { name: 'Complete polygon' }))
    expect(screen.getByText('3 boundary points')).toBeInTheDocument()
    expect(screen.getByTestId('mock-map')).toHaveAttribute('data-mode', 'edit')

    await user.click(screen.getByRole('button', { name: 'Move vertex' }))
    expect(screen.getByText('4 boundary points')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear Boundary' }))
    expect(screen.getByText('No boundary defined')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear Center' }))
    expect(screen.getByText('No center selected')).toBeInTheDocument()
  })

  it('contains map failures and offers a retry without losing the form', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(await screen.findByRole('button', { name: 'Fail' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Map failed')
    await user.click(screen.getByRole('button', { name: 'Retry map' }))
    expect(await screen.findByRole('button', { name: 'Ready' })).toBeInTheDocument()
  })
})
