import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

import DeleteAlert, { type DeleteAlertRef } from './DeleteAlert'

describe('DeleteAlert', () => {
  it('never calls delete before confirmation and cancel closes without deleting', async () => {
    const user = userEvent.setup()
    const ref = createRef<DeleteAlertRef>()
    const onDelete = vi.fn()
    const onCancel = vi.fn()
    render(
      <DeleteAlert
        ref={ref}
        title="Delete assistant?"
        body="This cannot be undone"
        onDelete={onDelete}
        onCancel={onCancel}
      />
    )

    act(() => ref.current?.handleOpen(true))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(await screen.findByRole('button', { name: 'button.cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('confirms explicitly and cannot close through Escape while pending', async () => {
    const user = userEvent.setup()
    const ref = createRef<DeleteAlertRef>()
    const onDelete = vi.fn()
    const { rerender } = render(
      <DeleteAlert ref={ref} title="Delete assistant?" body="This cannot be undone" onDelete={onDelete} />
    )

    act(() => ref.current?.handleOpen(true))
    await user.click(await screen.findByRole('button', { name: 'button.confirm' }))
    expect(onDelete).toHaveBeenCalledOnce()

    rerender(
      <DeleteAlert ref={ref} title="Delete assistant?" body="This cannot be undone" isPending onDelete={onDelete} />
    )
    fireEvent.keyDown(await screen.findByRole('alertdialog'), { key: 'Escape' })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'button.deleting' })).toBeDisabled()
  })
})
