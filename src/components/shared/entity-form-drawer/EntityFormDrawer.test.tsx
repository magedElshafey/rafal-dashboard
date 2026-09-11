import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import '@/config/i18'

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

  it('exposes separate create intents without closing the drawer itself', async () => {
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn()
    const onSubmitAndCreateAnother = vi.fn()
    render(
      <EntityFormDrawer
        {...baseProps}
        mode="create"
        createAnotherLabel="Create and create another"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        onSubmitAndCreateAnother={onSubmitAndCreateAnother}
      >
        <div>Create form</div>
      </EntityFormDrawer>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create and create another' }))

    expect(screen.getByRole('button', { name: 'Create and create another' })).toHaveAttribute(
      'data-submit-intent',
      'create-another'
    )
    expect(onSubmitAndCreateAnother).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('data-submit-intent', 'create')
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('disables both create submit actions while pending', () => {
    render(
      <EntityFormDrawer
        {...baseProps}
        mode="create"
        createAnotherLabel="Create and create another"
        onOpenChange={vi.fn()}
        isSubmitting
      >
        <div>Create form</div>
      </EntityFormDrawer>
    )

    expect(screen.getByRole('button', { name: 'Create and create another' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('supports a pristine edit guard and a form-shaped default loading state', () => {
    const view = render(
      <EntityFormDrawer {...baseProps} onOpenChange={vi.fn()} isSubmitDisabled>
        <div>Edit form</div>
      </EntityFormDrawer>
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    view.rerender(
      <EntityFormDrawer {...baseProps} onOpenChange={vi.fn()} isLoading>
        <div>Edit form</div>
      </EntityFormDrawer>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8)
    expect(screen.queryByText('Edit form')).not.toBeInTheDocument()
  })
})
