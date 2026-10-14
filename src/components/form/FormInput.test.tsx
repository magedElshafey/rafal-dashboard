import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as yup from 'yup'
import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from './FormInput'

describe('FormInput descriptions', () => {
  it('keeps help and validation associated with their own field, preserving callers without help', async () => {
    const user = userEvent.setup()
    render(
      <FormWrapper
        defaultValues={{ count: '', reference: '' }}
        schema={yup.object({ count: yup.string().required('Count is required'), reference: yup.string() })}
        onSubmit={vi.fn()}
      >
        <FormInput name="count" label="Count" description="Enter the counted quantity." />
        <FormInput name="reference" label="Reference" />
        <button type="submit">Review</button>
      </FormWrapper>
    )
    const count = screen.getByRole('textbox', { name: 'Count' })
    const reference = screen.getByRole('textbox', { name: 'Reference' })
    expect(count).toHaveAccessibleDescription('Enter the counted quantity.')
    expect(reference).not.toHaveAccessibleDescription()
    await user.click(screen.getByRole('button', { name: 'Review' }))
    expect(await screen.findByText('Count is required')).toBeInTheDocument()
    expect(count).toHaveAccessibleDescription('Enter the counted quantity. Count is required')
    expect(count).toHaveFocus()
    expect(reference).not.toHaveAttribute('aria-invalid', 'true')
    await user.type(count, '5')
    expect(count).toHaveAccessibleDescription('Enter the counted quantity.')
  })
})
