import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { LocationBoundaryEditor, type LocationBoundaryEditorLabels } from './LocationBoundaryEditor'
import type { Coordinate } from '@/types/geo.types'

const labels: LocationBoundaryEditorLabels = {
  boundary: 'Boundary',
  boundaryDescription: 'Boundary description',
  center: 'Center',
  centerDescription: 'Center description',
  point: (index) => `Point ${index}`,
  latitude: 'Latitude',
  longitude: 'Longitude',
  addPoint: 'Add Point',
  removePoint: (index) => `Remove Point ${index}`,
  movePointUp: (index) => `Move Point ${index} Up`,
  movePointDown: (index) => `Move Point ${index} Down`,
  clearBoundary: 'Clear Boundary',
  setCenter: 'Set Center',
  clearCenter: 'Clear Center',
  noBoundary: 'No boundary',
  noCenter: 'No center',
}

function Harness({
  disabled = false,
  initialBoundary = [],
  initialCenter = null,
}: {
  disabled?: boolean
  initialBoundary?: Coordinate[]
  initialCenter?: Coordinate | null
}) {
  const [boundary, setBoundary] = useState<Coordinate[]>(initialBoundary)
  const [center, setCenter] = useState<Coordinate | null>(initialCenter)
  return (
    <LocationBoundaryEditor
      boundary={boundary}
      center={center}
      onBoundaryChange={setBoundary}
      onCenterChange={setCenter}
      labels={labels}
      disabled={disabled}
    />
  )
}

describe('LocationBoundaryEditor', () => {
  it('creates blank points, accepts explicit zero, preserves order, reorders, removes, and clears', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Add Point' }))
    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Longitude' })).toHaveValue(null)
    await user.type(screen.getByRole('spinbutton', { name: 'Latitude' }), '0')
    await user.type(screen.getByRole('spinbutton', { name: 'Longitude' }), '10')
    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(0)

    await user.click(screen.getByRole('button', { name: 'Add Point' }))
    const latitudes = screen.getAllByRole('spinbutton', { name: 'Latitude' })
    const longitudes = screen.getAllByRole('spinbutton', { name: 'Longitude' })
    await user.type(latitudes[1], '20')
    await user.type(longitudes[1], '30')
    await user.click(screen.getByRole('button', { name: 'Move Point 2 Up' }))
    expect(screen.getAllByRole('spinbutton', { name: 'Latitude' })[0]).toHaveValue(20)
    expect(screen.getAllByRole('spinbutton', { name: 'Latitude' })[1]).toHaveValue(0)

    await user.click(screen.getByRole('button', { name: 'Remove Point 2' }))
    expect(screen.getAllByRole('spinbutton', { name: 'Latitude' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear Boundary' }))
    expect(screen.getByText('No boundary')).toBeInTheDocument()
  })

  it('creates a blank center, accepts values, and clears it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Longitude' })).toHaveValue(null)
    await user.type(screen.getByRole('spinbutton', { name: 'Latitude' }), '0')
    await user.type(screen.getByRole('spinbutton', { name: 'Longitude' }), '46.7')
    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(0)
    expect(screen.getByRole('spinbutton', { name: 'Longitude' })).toHaveValue(46.7)
    await user.click(screen.getByRole('button', { name: 'Clear Center' }))
    expect(screen.getByText('No center')).toBeInTheDocument()
  })

  it('disables all editing entry points while pending', () => {
    render(
      <Harness
        disabled
        initialBoundary={[
          { lat: 1, lng: 2 },
          { lat: 3, lng: 4 },
        ]}
        initialCenter={{ lat: 5, lng: 6 }}
      />
    )
    expect(screen.getByRole('button', { name: 'Add Point' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clear Boundary' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove Point 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Point 1 Down' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Clear Center' })).toBeDisabled()
    screen.getAllByRole('spinbutton').forEach((input) => expect(input).toBeDisabled())
  })
})
