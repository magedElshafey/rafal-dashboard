import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { GlobalSearch } from './GlobalSearch'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../hooks/useGlobalSearch', () => ({
  useGlobalSearch: () => ({
    results: [],
    isIdle: true,
    isLoading: false,
    isError: false,
    isSuccess: false,
    canSearch: false,
  }),
}))

describe('GlobalSearch responsive sizing', () => {
  it('can shrink within the tablet navbar without forcing horizontal page overflow', () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'teachers_layout.search.open_global_search' })).toHaveClass(
      'min-w-0',
      'flex-1',
      'shrink'
    )
  })
})
