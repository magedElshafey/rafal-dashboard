import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProgressBar } from './ProgressBar'

describe('ProgressBar percentage colors', () => {
  it.each([
    [0, 0, 'bg-neutral-600'],
    [1, 1, 'bg-error-500'],
    [20, 20, 'bg-error-500'],
    [21, 21, 'bg-orange-500'],
    [40, 40, 'bg-orange-500'],
    [41, 41, 'bg-yellow-500'],
    [60, 60, 'bg-yellow-500'],
    [61, 61, 'bg-brand-500'],
    [80, 80, 'bg-brand-500'],
    [99, 99, 'bg-brand-500'],
    [100, 100, 'bg-success-600'],
    [-5, 0, 'bg-neutral-600'],
    [120, 100, 'bg-success-600'],
  ] as const)('renders %s as visual value %s with %s', (value, safeValue, colorClass) => {
    render(<ProgressBar value={value} ariaLabel={`Progress ${value}`} />)

    const progress = screen.getByRole('progressbar', { name: `Progress ${value}` })
    expect(progress).toHaveAttribute('aria-valuenow', String(safeValue))
    expect(progress.firstElementChild).toHaveClass(colorClass)
    expect(progress.firstElementChild).toHaveStyle({ width: `${safeValue}%` })
  })

  it('preserves explicit variant and indicator class overrides', () => {
    const { rerender } = render(<ProgressBar value={20} variant="info" ariaLabel="Variant progress" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveClass('bg-info-600')

    rerender(<ProgressBar value={20} indicatorClassName="bg-purple-500" ariaLabel="Custom progress" />)
    expect(screen.getByRole('progressbar').firstElementChild).toHaveClass('bg-purple-500')
  })
})
