import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RegionsListSkeleton } from './RegionsListSkeleton'

describe('RegionsListSkeleton', () => {
  it('mirrors the six table columns and four mobile facts', () => {
    const { container } = render(<RegionsListSkeleton />)
    const root = container.firstElementChild
    const desktop = root?.children[0]
    const mobile = root?.children[1]
    expect(desktop?.children[0].children).toHaveLength(6)
    expect(desktop?.children[1].children).toHaveLength(6)
    expect(mobile?.children[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6)
  })
})
