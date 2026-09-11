import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PaginatedListFooter from './PaginatedListFooter'

const forwardAddQuery = vi.fn()

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({ forwardAddQuery }),
}))

describe('PaginatedListFooter', () => {
  beforeEach(() => forwardAddQuery.mockClear())

  it('renders the backend pagination range and moves to another page', async () => {
    const user = userEvent.setup()

    render(
      <PaginatedListFooter
        pagination={{
          total: 149,
          count: 15,
          per_page: 15,
          next_page_url: 'https://example.test?page=3',
          prev_page_url: 'https://example.test?page=1',
          current_page: 2,
          total_pages: 10,
        }}
        itemCount={15}
        getRangeLabel={({ start, end, total }) => `Showing ${start} to ${end} of ${total}`}
      />
    )

    expect(screen.getByText('Showing 16 to 30 of 149')).toBeInTheDocument()

    await user.click(screen.getByText('3'))

    expect(forwardAddQuery).toHaveBeenCalledWith({ page: '3' })
  })

  it('does not render for a single backend page', () => {
    const { container } = render(
      <PaginatedListFooter
        pagination={{
          total: 15,
          count: 15,
          per_page: 15,
          next_page_url: null,
          prev_page_url: null,
          current_page: 1,
          total_pages: 1,
        }}
        itemCount={15}
        getRangeLabel={({ start, end, total }) => `Showing ${start} to ${end} of ${total}`}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
