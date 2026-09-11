import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { GroupHierarchyPreview } from './GroupHierarchyPreview'

beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

function renderPreview(
  groups = [{ id: 'group-1', name: 'Group One' }],
  subgroups = [
    { id: 'subgroup-1', name: 'Subgroup One' },
    { id: 'subgroup-2', name: 'Subgroup Two' },
  ]
) {
  render(
    <GroupHierarchyPreview groups={groups} subgroups={subgroups} groupsLabel="Groups" subgroupsLabel="Subgroups" />
  )
}

describe('GroupHierarchyPreview', () => {
  it('renders compact Groups and Subgroups triggers and reveals single or multiple values', async () => {
    const user = userEvent.setup()
    renderPreview()

    expect(screen.getByRole('button', { name: 'Groups' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subgroups' })).toBeInTheDocument()
    expect(screen.queryByText('Group One')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Groups' }))
    expect(within(screen.getByRole('dialog', { name: 'Groups' })).getByText('Group One')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Subgroups' }))
    const subgroupsDialog = screen.getByRole('dialog', { name: 'Subgroups' })
    expect(within(subgroupsDialog).getByText('Subgroup One')).toBeInTheDocument()
    expect(within(subgroupsDialog).getByText('Subgroup Two')).toBeInTheDocument()
  })

  it('handles empty values safely in both panels', async () => {
    const user = userEvent.setup()
    renderPreview([], [])

    await user.click(screen.getByRole('button', { name: 'Groups' }))
    expect(within(screen.getByRole('dialog', { name: 'Groups' })).getByText('-')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Subgroups' }))
    expect(within(screen.getByRole('dialog', { name: 'Subgroups' })).getByText('-')).toBeInTheDocument()
  })

  it('supports keyboard activation and Escape dismissal', async () => {
    const user = userEvent.setup()
    renderPreview()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Groups' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'Groups' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Groups' })).not.toBeInTheDocument()
  })

  it('keeps a large list inside a bounded scrollable wrapping panel', async () => {
    const user = userEvent.setup()
    const groups = Array.from({ length: 30 }, (_, index) => ({ id: String(index), name: `Group ${index + 1}` }))
    renderPreview(groups)

    await user.click(screen.getByRole('button', { name: 'Groups' }))
    const dialog = screen.getByRole('dialog', { name: 'Groups' })
    const scrollArea = dialog.firstElementChild
    expect(scrollArea).toHaveClass('max-h-64', 'overflow-y-auto')
    expect(within(dialog).getByText('Group 30')).toBeInTheDocument()
  })
})
