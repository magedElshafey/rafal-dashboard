import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as yup from 'yup'

import { FormInput } from '../form/FormInput'
import { Button } from '../ui/button'
import { FormWrapper } from './FormWrapper'

type TestFormValues = {
  name: string
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
})

describe('FormWrapper render isolation', () => {
  it('does not rerender unsubscribed children for dirty or error state changes', async () => {
    const user = userEvent.setup()
    const renderUnsubscribedChild = vi.fn()

    function UnsubscribedChild() {
      renderUnsubscribedChild()
      return <span>Static form content</span>
    }

    render(
      <FormWrapper<TestFormValues>
        schema={schema}
        defaultValues={{ name: '' }}
        validationMode="onSubmit"
        onSubmit={vi.fn()}
      >
        <FormInput name="name" label="Name" />
        <UnsubscribedChild />
        <Button type="submit">Submit</Button>
      </FormWrapper>
    )

    renderUnsubscribedChild.mockClear()

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Alex')
    await user.clear(screen.getByRole('textbox', { name: 'Name' }))

    expect(renderUnsubscribedChild).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(renderUnsubscribedChild).not.toHaveBeenCalled()
  })

  it('submits directly when a mode intentionally omits the resolver schema', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <FormWrapper<TestFormValues> defaultValues={{ name: '' }} onSubmit={onSubmit}>
        <FormInput name="name" label="Name" required />
        <Button type="submit">Submit without resolver</Button>
      </FormWrapper>
    )

    await user.click(screen.getByRole('button', { name: 'Submit without resolver' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: '' }, expect.any(Object))
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })
})
