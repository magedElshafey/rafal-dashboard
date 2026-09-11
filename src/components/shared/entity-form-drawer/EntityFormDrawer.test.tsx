import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EntityFormDrawer from './EntityFormDrawer'

const baseProps = {
  open: true,
  mode: 'edit' as const,
  titles: { create: 'Create session', edit: 'Edit session' },
  descriptions: { create: 'Create description', edit: 'Edit description' },
  submitLabels: { create: 'Create', edit: 'Save' },
  cancelLabel: 'Cancel',
  closeLabel: 'Close',
}

describe('EntityFormDrawer lifecycle', () => {
  it('keeps the dialog and overlay mounted when body content finishes loading', () => {
    const onOpenChange = vi.fn()
    const view = render(
      <EntityFormDrawer {...baseProps} onOpenChange={onOpenChange} isLoading loadingContent={<div>Loading</div>}>
        <div>Hydrated form</div>
      </EntityFormDrawer>
    )
    const dialog = screen.getByRole('dialog')
    const overlay = document.querySelector('[data-slot="sheet-overlay"]')

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(overlay).not.toBeNull()

    view.rerender(
      <EntityFormDrawer {...baseProps} onOpenChange={onOpenChange}>
        <div>Hydrated form</div>
      </EntityFormDrawer>
    )

    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toBe(overlay)
    expect(screen.getByText('Hydrated form')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('preserves the shared Escape close behavior', () => {
    const onOpenChange = vi.fn()
    render(
      <EntityFormDrawer {...baseProps} onOpenChange={onOpenChange}>
        <button type="button">Form field</button>
      </EntityFormDrawer>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
