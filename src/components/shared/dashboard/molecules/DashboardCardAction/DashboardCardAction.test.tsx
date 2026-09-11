import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Eye, Pencil } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { DashboardCardActions, type CardActionItem } from './DashboardCardAction'

function createAction(overrides: Partial<CardActionItem> = {}): CardActionItem {
  return {
    id: 'preview',
    label: 'Preview Mathematics Formula Sheet',
    icon: Eye,
    onClick: vi.fn(),
    ...overrides,
  }
}

describe('DashboardCardActions', () => {
  it('keeps the default one-action direct trigger behavior', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<DashboardCardActions actions={[createAction({ onClick })]} />)

    const directTrigger = screen.getByRole('button', { name: 'Preview Mathematics Formula Sheet' })

    expect(screen.queryByRole('button', { name: 'Open actions menu' })).not.toBeInTheDocument()
    expect(directTrigger).toHaveAttribute('title', 'Preview Mathematics Formula Sheet')

    await user.click(directTrigger)

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('can force a resource-labelled overflow menu for one action', async () => {
    const user = userEvent.setup()

    render(
      <DashboardCardActions
        actions={[createAction()]}
        triggerMode="menu"
        triggerLabel="Open actions for Mathematics Formula Sheet"
      />
    )

    const menuTrigger = screen.getByRole('button', { name: 'Open actions for Mathematics Formula Sheet' })

    expect(screen.queryByRole('button', { name: 'Preview Mathematics Formula Sheet' })).not.toBeInTheDocument()

    await user.click(menuTrigger)

    expect(await screen.findByRole('menuitem', { name: 'Preview Mathematics Formula Sheet' })).toBeVisible()
  })

  it('keeps a disabled forced-menu trigger non-interactive', async () => {
    const user = userEvent.setup()

    render(<DashboardCardActions actions={[createAction()]} triggerMode="menu" disabled />)

    const menuTrigger = screen.getByRole('button', { name: 'Open actions menu' })
    expect(menuTrigger).toBeDisabled()

    await user.click(menuTrigger)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps compact visible copy while exposing a resource-specific action name', async () => {
    const user = userEvent.setup()

    render(
      <DashboardCardActions
        actions={[createAction({ label: 'View', accessibleLabel: 'View Mathematics Formula Sheet' })]}
        triggerMode="menu"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Open actions menu' }))

    expect(await screen.findByRole('menuitem', { name: 'View Mathematics Formula Sheet' })).toHaveTextContent('View')
  })

  it('supports keyboard opening, activation, and Escape dismissal', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <DashboardCardActions
        actions={[createAction({ onClick })]}
        triggerMode="menu"
        triggerLabel="Open actions for Mathematics Formula Sheet"
      />
    )

    const menuTrigger = screen.getByRole('button', { name: 'Open actions for Mathematics Formula Sheet' })

    await user.tab()
    expect(menuTrigger).toHaveFocus()

    await user.keyboard('{Enter}')
    const menuItem = await screen.findByRole('menuitem', { name: 'Preview Mathematics Formula Sheet' })
    expect(menuItem).toHaveFocus()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(menuTrigger).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menuitem', { name: 'Preview Mathematics Formula Sheet' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('prevents disabled and loading actions in both trigger modes', async () => {
    const user = userEvent.setup()
    const disabledClick = vi.fn()
    const loadingClick = vi.fn()
    const { rerender } = render(
      <DashboardCardActions actions={[createAction({ disabled: true, onClick: disabledClick })]} />
    )

    const disabledTrigger = screen.getByRole('button', { name: 'Preview Mathematics Formula Sheet' })
    expect(disabledTrigger).toBeDisabled()

    fireEvent.click(disabledTrigger)
    expect(disabledClick).not.toHaveBeenCalled()

    rerender(
      <DashboardCardActions
        actions={[
          createAction({ isLoading: true, onClick: loadingClick }),
          createAction({ id: 'edit', label: 'Edit', icon: Pencil }),
        ]}
        triggerLabel="Open actions for Mathematics Formula Sheet"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Open actions for Mathematics Formula Sheet' }))

    const loadingItem = await screen.findByRole('menuitem', { name: 'Preview Mathematics Formula Sheet' })
    expect(loadingItem).toHaveAttribute('aria-disabled', 'true')
    expect(loadingItem).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(loadingItem)
    expect(loadingClick).not.toHaveBeenCalled()
  })

  it('applies semantic interaction colors to destructive actions', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DashboardCardActions
        actions={[
          createAction({ id: 'view', label: 'View' }),
          createAction({ id: 'delete', label: 'Delete', variant: 'destructive' }),
        ]}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Open actions menu' }))

    expect(await screen.findByRole('menuitem', { name: 'View' })).toHaveClass(
      'hover:bg-accent',
      'hover:text-accent-foreground'
    )
    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toHaveClass(
      'text-destructive',
      'hover:bg-destructive/10',
      'focus:text-destructive'
    )

    await user.keyboard('{Escape}')
    rerender(<DashboardCardActions actions={[createAction({ label: 'Delete', variant: 'destructive' })]} />)

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'text-destructive',
      'hover:bg-destructive/10',
      'active:text-destructive'
    )
  })
})
