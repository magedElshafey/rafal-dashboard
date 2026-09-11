import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('preserves existing semantic variants and supports the additive warning variant', () => {
    const { rerender } = render(<Badge variant="success">High</Badge>)

    expect(screen.getByText('High')).toHaveClass('bg-success')

    rerender(<Badge variant="error">Low</Badge>)
    expect(screen.getByText('Low')).toHaveClass('text-destructive')

    rerender(<Badge variant="warning">Middle</Badge>)
    expect(screen.getByText('Middle')).toHaveClass('bg-warning')
  })
})
