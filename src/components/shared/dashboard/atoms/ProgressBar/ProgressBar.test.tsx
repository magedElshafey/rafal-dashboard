import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProgressBar } from './ProgressBar'

describe('ProgressBar percentage colors', () => {
  it.each([
    [0, 0, 'bg-muted-foreground'],
    [1, 1, 'bg-destructive'],
    [20, 20, 'bg-destructive'],
    [21, 21, 'bg-warning'],
    [40, 40, 'bg-warning'],
    [41, 41, 'bg-warning'],
    [60, 60, 'bg-warning'],
    [61, 61, 'bg-primary'],
    [80, 80, 'bg-primary'],
    [99, 99, 'bg-primary'],
    [100, 100, 'bg-success'],
    [-5, 0, 'bg-muted-foreground'],
    [120, 100, 'bg-success'],
  ] as const)('renders %s as visual value %s with %s', (value, safeValue, colorClass) => {
    render(<ProgressBar value={value} ariaLabel={`Progress ${value}`} />)

    const progress = screen.getByRole('progressbar', { name: `Progress ${value}` })
    expect(progress).toHaveAttribute('aria-valuenow', String(safeValue))
    expect(progress.firstElementChild).toHaveClass(colorClass)
    expect(progress.firstElementChild).toHaveStyle({ width: `${safeValue}%` })
  })

  it('preserves explicit variant and indicator class overrides', () => {
    const { rerender } = render(<ProgressBar value={20} variant="info" ariaLabel="Variant progress" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveClass('bg-info')

    rerender(<ProgressBar value={20} indicatorClassName="bg-purple-500" ariaLabel="Custom progress" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveClass('bg-purple-500')
  })
})
