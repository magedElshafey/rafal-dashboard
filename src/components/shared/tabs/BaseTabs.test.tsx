import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BaseTabs, type BaseTabsProps } from './BaseTabs'

type TabValue = 'all' | 'pending' | 'completed' | 'archived'

const tabs = [
  { value: 'all' as const, label: 'All' },
  { value: 'pending' as const, label: 'Pending' },
  { value: 'completed' as const, label: 'Completed' },
]
const fourTabs = [...tabs, { value: 'archived' as const, label: 'Archived' }]

function renderTabs(overrides: Partial<BaseTabsProps<TabValue>> = {}) {
  const onValueChange = vi.fn()

  render(
    <BaseTabs tabs={tabs} activeValue="all" onValueChange={onValueChange} ariaLabel="Filter tasks" {...overrides} />
  )

  return { onValueChange }
}

describe('BaseTabs', () => {
  it.each([2, 3, 4])('lets %i full-width segmented tabs fill or overflow their container safely', (tabsCount) => {
    renderTabs({ fullWidth: true, tabs: fourTabs.slice(0, tabsCount) })

    const tabList = screen.getByRole('tablist', { name: 'Filter tasks' })
    const allTab = screen.getByRole('tab', { name: 'All' })
    const pendingTab = screen.getByRole('tab', { name: 'Pending' })

    expect(tabList).toHaveClass('flex', 'w-max', 'min-w-full', 'bg-surface-light')
    expect(allTab).toHaveClass('min-h-10', 'min-w-max', 'flex-1')
    expect(allTab).toHaveClass('bg-surface-card', 'text-brand-500')
    expect(pendingTab).toHaveClass('bg-transparent', 'text-content-primary')
    expect(allTab).toHaveAttribute('aria-selected', 'true')
    expect(allTab).toHaveAttribute('tabindex', '0')
    expect(pendingTab).toHaveAttribute('aria-selected', 'false')
    expect(pendingTab).toHaveAttribute('tabindex', '-1')
  })

  it('keeps long segmented labels, icons, and counts intact inside the horizontal overflow track', () => {
    renderTabs({
      fullWidth: true,
      tabs: [
        {
          value: 'all',
          label: 'All assignments requiring detailed review',
          icon: <svg data-testid="tab-icon" />,
          count: 128,
        },
        tabs[1],
      ],
    })

    const tabList = screen.getByRole('tablist', { name: 'Filter tasks' })
    const longLabel = screen.getByText('All assignments requiring detailed review')
    const iconWrapper = screen.getByTestId('tab-icon').parentElement
    const count = screen.getByText('(128)')

    expect(tabList.parentElement).toHaveClass('overflow-x-auto')
    expect(longLabel).toHaveClass('whitespace-nowrap')
    expect(longLabel).not.toHaveClass('break-words', 'whitespace-normal')
    expect(iconWrapper).toHaveClass('shrink-0')
    expect(count).toHaveClass('shrink-0')
  })

  it('preserves the explicit pills and underline variants', () => {
    const { rerender } = render(
      <BaseTabs tabs={tabs} activeValue="all" onValueChange={vi.fn()} variant="pills" ariaLabel="Statuses" />
    )

    expect(screen.getByRole('tablist')).toHaveClass('inline-flex', 'gap-3')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('rounded-full', 'bg-brand-500!')

    rerender(
      <BaseTabs tabs={tabs} activeValue="all" onValueChange={vi.fn()} variant="underline" ariaLabel="Statuses" />
    )

    expect(screen.getByRole('tablist')).toHaveClass('border-b', 'border-border-subtle')
    expect(screen.getByRole('tab', { name: 'All' })).toHaveClass('border-brand-500', 'text-brand-500')
  })

  it('activates tabs with pointer, Enter, and Space through native button behavior', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderTabs()
    const completedTab = screen.getByRole('tab', { name: 'Completed' })

    await user.click(completedTab)
    completedTab.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onValueChange).toHaveBeenNthCalledWith(1, 'completed')
    expect(onValueChange).toHaveBeenNthCalledWith(2, 'completed')
    expect(onValueChange).toHaveBeenNthCalledWith(3, 'completed')
  })

  it('moves focus manually with arrows and Home/End while skipping disabled tabs', () => {
    const onValueChange = vi.fn()
    render(
      <BaseTabs
        tabs={[tabs[0], { ...tabs[1], disabled: true }, tabs[2]]}
        activeValue="all"
        onValueChange={onValueChange}
        ariaLabel="Statuses"
      />
    )

    const allTab = screen.getByRole('tab', { name: 'All' })
    const pendingTab = screen.getByRole('tab', { name: 'Pending' })
    const completedTab = screen.getByRole('tab', { name: 'Completed' })

    allTab.focus()
    fireEvent.keyDown(allTab, { key: 'ArrowRight' })
    expect(completedTab).toHaveFocus()

    fireEvent.keyDown(completedTab, { key: 'ArrowRight' })
    expect(allTab).toHaveFocus()

    fireEvent.keyDown(allTab, { key: 'ArrowLeft' })
    expect(completedTab).toHaveFocus()

    fireEvent.keyDown(completedTab, { key: 'Home' })
    expect(allTab).toHaveFocus()

    fireEvent.keyDown(allTab, { key: 'End' })
    expect(completedTab).toHaveFocus()
    expect(pendingTab).toBeDisabled()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reverses horizontal arrow behavior in RTL', () => {
    render(
      <div dir="rtl">
        <BaseTabs tabs={tabs} activeValue="all" onValueChange={vi.fn()} ariaLabel="Statuses" />
      </div>
    )

    const allTab = screen.getByRole('tab', { name: 'All' })
    const completedTab = screen.getByRole('tab', { name: 'Completed' })

    allTab.focus()
    fireEvent.keyDown(allTab, { key: 'ArrowRight' })
    expect(completedTab).toHaveFocus()

    fireEvent.keyDown(completedTab, { key: 'ArrowLeft' })
    expect(allTab).toHaveFocus()
  })

  it('generates stable tab IDs and associates tabs with an optional panel', () => {
    renderTabs({ id: 'task-status', panelId: 'task-results', label: 'Task status' })

    const tabList = screen.getByRole('tablist', { name: 'Task status' })
    const pendingTab = screen.getByRole('tab', { name: 'Pending' })

    expect(tabList).toHaveAttribute('id', 'task-status')
    expect(tabList).toHaveAttribute('aria-orientation', 'horizontal')
    expect(pendingTab).toHaveAttribute('id', 'task-status-tab-pending')
    expect(pendingTab).toHaveAttribute('aria-controls', 'task-results')
  })

  it('keeps the first enabled tab keyboard reachable when activeValue is unavailable', () => {
    renderTabs({ activeValue: 'pending', tabs: [{ ...tabs[0], disabled: true }, tabs[2]] })

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Completed' })).toHaveAttribute('tabindex', '0')
  })
})
