import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppTabs } from './AppTabs'

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
]

describe('AppTabs', () => {
  it('defaults to segmented and forwards its controlled API and panel association', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()

    render(
      <AppTabs
        tabs={tabs}
        activeTab="all"
        onTabChange={onTabChange}
        ariaLabel="Statuses"
        id="app-status"
        panelId="app-results"
      />
    )

    expect(screen.getByRole('tablist')).toHaveClass('bg-surface-light')
    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-controls', 'app-results')

    await user.click(screen.getByRole('tab', { name: 'Pending' }))
    expect(onTabChange).toHaveBeenCalledWith('pending')
  })

  it('delegates responsive full-width overflow behavior to BaseTabs', () => {
    render(<AppTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} fullWidth ariaLabel="Statuses" />)

    expect(screen.getByRole('tablist')).toHaveClass('flex', 'w-max', 'min-w-full')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('min-w-max', 'flex-1')
  })

  it('preserves explicit pills and underline variants', () => {
    const { rerender } = render(
      <AppTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} variant="pills" ariaLabel="Statuses" />
    )

    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('rounded-full', 'bg-brand-500!')

    rerender(<AppTabs tabs={tabs} activeTab="all" onTabChange={vi.fn()} variant="underline" ariaLabel="Statuses" />)

    expect(screen.getByRole('tablist')).toHaveClass('border-b')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('border-brand-500')
  })
})
