import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import QueryTabsFilter from './QueryTabsFilter'

const queryMocks = vi.hoisted(() => ({
  forwardAddQuery: vi.fn(),
  forwardDeleteQuery: vi.fn(),
  forwardQuery: null as Record<string, string> | null,
}))

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => queryMocks,
}))

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

describe('QueryTabsFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryMocks.forwardQuery = null
  })

  it('defaults to segmented and forwards full-width and panel ARIA props', () => {
    render(
      <QueryTabsFilter
        name="status"
        tabs={tabs}
        defaultValue="all"
        fullWidth
        id="query-status"
        panelId="query-results"
      />
    )

    expect(screen.getByRole('tablist', { name: 'status' })).toHaveClass(
      'flex',
      'w-max',
      'min-w-full',
      'bg-surface-light'
    )
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('id', 'query-status-tab-all')
    expect(screen.getByRole('tab', { name: 'Completed' })).toHaveAttribute('aria-controls', 'query-results')
  })

  it('preserves explicit pills and underline variants', () => {
    const { rerender } = render(<QueryTabsFilter name="status" tabs={tabs} defaultValue="all" variant="pills" />)

    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('rounded-full', 'bg-brand-500!')

    rerender(<QueryTabsFilter name="status" tabs={tabs} defaultValue="all" variant="underline" />)

    expect(screen.getByRole('tablist')).toHaveClass('border-b')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('border-brand-500')
  })

  it('adds a query value and reports the selected value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const queryUpdateOptions = { resetQueryNames: ['page'] }

    render(
      <QueryTabsFilter
        name="status"
        tabs={tabs}
        defaultValue="all"
        onValueChange={onValueChange}
        queryUpdateOptions={queryUpdateOptions}
      />
    )

    await user.click(screen.getByRole('tab', { name: 'Pending' }))

    expect(queryMocks.forwardAddQuery).toHaveBeenCalledWith({ status: 'pending' }, queryUpdateOptions)
    expect(queryMocks.forwardDeleteQuery).not.toHaveBeenCalled()
    expect(onValueChange).toHaveBeenCalledWith('pending')
  })

  it('does not navigate when the active clearValue is already absent from the query', async () => {
    const user = userEvent.setup()
    render(<QueryTabsFilter name="status" tabs={tabs} defaultValue="all" clearValue="all" />)

    await user.click(screen.getByRole('tab', { name: 'All' }))

    expect(queryMocks.forwardDeleteQuery).not.toHaveBeenCalled()
  })

  it('deletes the query for clearValue and for an allowClear active tab', async () => {
    const user = userEvent.setup()
    queryMocks.forwardQuery = { status: 'pending' }
    const { rerender } = render(<QueryTabsFilter name="status" tabs={tabs} clearValue="all" />)

    await user.click(screen.getByRole('tab', { name: 'All' }))
    expect(queryMocks.forwardDeleteQuery).toHaveBeenCalledWith('status', undefined)

    vi.clearAllMocks()
    queryMocks.forwardQuery = { status: 'pending' }
    rerender(<QueryTabsFilter name="status" tabs={tabs} allowClear />)

    await user.click(screen.getByRole('tab', { name: 'Pending' }))
    expect(queryMocks.forwardDeleteQuery).toHaveBeenCalledWith('status', undefined)
  })

  it('does not navigate or notify when a non-clearable active tab is selected again', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    queryMocks.forwardQuery = { status: 'pending' }

    render(<QueryTabsFilter name="status" tabs={tabs} onValueChange={onValueChange} />)

    await user.click(screen.getByRole('tab', { name: 'Pending' }))

    expect(queryMocks.forwardAddQuery).not.toHaveBeenCalled()
    expect(queryMocks.forwardDeleteQuery).not.toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
