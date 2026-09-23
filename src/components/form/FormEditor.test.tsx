import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { FormEditor } from './FormEditor'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
document.elementFromPoint = () => document.querySelector('[role="textbox"]')
Range.prototype.getClientRects = () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect = () => new DOMRect()

function Harness({
  initial = '<p>Hello</p>',
  disabled = false,
  dir = 'ltr',
}: {
  initial?: string
  disabled?: boolean
  dir?: 'rtl' | 'ltr'
}) {
  const methods = useForm({ defaultValues: { description: initial } })
  const value = useWatch({ control: methods.control, name: 'description' })
  return (
    <FormProvider {...methods}>
      <FormEditor name="description" label="Description" disabled={disabled} dir={dir} />
      <output>{value}</output>
      <button type="button" onClick={() => methods.reset({ description: '<p>Reset value</p>' })}>
        Reset
      </button>
    </FormProvider>
  )
}

describe('FormEditor', () => {
  beforeAll(() => i18n.changeLanguage('en'))

  it('hydrates HTML, updates RHF with HTML, and emits an empty string when cleared', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const editor = screen.getByRole('textbox', { name: 'Description' })
    expect(editor).toHaveTextContent('Hello')
    await user.click(editor)
    await user.keyboard('{Control>}a{/Control}')
    await user.click(screen.getByRole('button', { name: 'Bold' }))
    expect(screen.getByRole('status')).toHaveTextContent('<p><strong>Hello</strong></p>')
    await user.click(editor)
    await user.keyboard('{Control>}a{/Control}{Backspace}')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('syncs an external reset without losing direction or disabled state', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness dir="rtl" />)
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Reset value')
    expect(screen.getByRole('textbox')).toHaveAttribute('dir', 'rtl')
    rerender(<Harness dir="ltr" disabled />)
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false')
    expect(screen.getByRole('textbox')).toHaveAttribute('dir', 'ltr')
  })

  it('normalizes visually empty hydrated HTML to an empty RHF string', async () => {
    render(<Harness initial="<p></p>" />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(''))
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('')
  })
})
