import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PackageOpen } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('associates its copy and renders optional actions', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onReset = vi.fn()

    render(
      <EmptyState
        title="No records yet"
        description="Create the first record to get started."
        icon={<PackageOpen data-testid="empty-icon" />}
        primaryAction={<Button onClick={onCreate}>Create record</Button>}
        secondaryAction={<Button onClick={onReset}>Reset filters</Button>}
      />
    )

    const state = screen.getByRole('region', { name: 'No records yet' })
    expect(state).toHaveAccessibleDescription('Create the first record to get started.')
    expect(screen.getByTestId('empty-icon').closest('[aria-hidden="true"]')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create record' }))
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(onCreate).toHaveBeenCalledOnce()
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('supports the compact presentation without requiring actions', () => {
    render(<EmptyState title="No matching results" variant="compact" />)

    expect(screen.getByRole('region', { name: 'No matching results' })).toHaveAttribute('data-variant', 'compact')
  })
})
