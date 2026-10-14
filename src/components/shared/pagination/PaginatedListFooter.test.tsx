import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PaginatedListFooter from './PaginatedListFooter'
import i18n from '@/config/i18'

const forwardAddQuery = vi.fn()

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({ forwardAddQuery }),
}))

describe('PaginatedListFooter', () => {
  beforeEach(async () => {
    forwardAddQuery.mockClear()
    await i18n.changeLanguage('en')
  })

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

  it('exposes disabled navigation and current page without changing URL state when unavailable', async () => {
    const user = userEvent.setup()
    render(
      <PaginatedListFooter
        pagination={{
          total: 126,
          count: 15,
          per_page: 15,
          current_page: 1,
          total_pages: 9,
          next_page_url: null,
          prev_page_url: null,
        }}
        itemCount={15}
        navigationDisabled
        navigationDescription="Paging pending"
        getRangeLabel={({ start, end, total }) => `${start}-${end}/${total}`}
      />
    )
    expect(screen.getByText('1-15/126')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toHaveAttribute('aria-current', 'page')
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
      await user.click(button)
    }
    expect(forwardAddQuery).not.toHaveBeenCalled()
    expect(screen.getByRole('navigation')).toHaveAccessibleDescription('Paging pending')
  })

  it('supports keyboard navigation and disables the next action on the last page', async () => {
    const user = userEvent.setup()
    render(
      <PaginatedListFooter
        pagination={{
          total: 30,
          count: 15,
          per_page: 15,
          current_page: 2,
          total_pages: 2,
          next_page_url: null,
          prev_page_url: null,
        }}
        itemCount={15}
        getRangeLabel={() => 'range'}
      />
    )
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(forwardAddQuery).toHaveBeenCalledExactlyOnceWith({ page: '1' })
  })

  it('keeps next-page keyboard navigation and localized current-page labels in RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    render(
      <PaginatedListFooter
        pagination={{
          total: 30,
          count: 15,
          per_page: 15,
          current_page: 1,
          total_pages: 2,
          next_page_url: null,
          prev_page_url: null,
        }}
        itemCount={15}
        getRangeLabel={() => 'range'}
      />
    )
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    const previous = screen.getByRole('button', { name: 'الانتقال إلى الصفحة السابقة' })
    const next = screen.getByRole('button', { name: 'الانتقال إلى الصفحة التالية' })
    expect(previous).toBeDisabled()
    expect(previous.querySelector('svg')).toHaveClass('rtl:rotate-180')
    expect(next.querySelector('svg')).toHaveClass('rtl:rotate-180')
    expect(
      screen.getByRole('button', { name: `الانتقال إلى الصفحة ${new Intl.NumberFormat('ar').format(1)}` })
    ).toHaveAttribute('aria-current', 'page')
    next.focus()
    await user.keyboard('{Enter}')
    expect(forwardAddQuery).toHaveBeenCalledExactlyOnceWith({ page: '2' })
  })
})
