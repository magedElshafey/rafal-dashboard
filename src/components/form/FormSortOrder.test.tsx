import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as yup from 'yup'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormSortOrder } from '@/components/form/FormSortOrder'

describe('FormSortOrder', () => {
  it('exposes reusable numeric constraints and submits a schema-normalized number', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <FormWrapper<{ order: number }>
        defaultValues={{ order: 0 }}
        schema={yup.object({ order: yup.number().integer().min(0).required() })}
        onSubmit={onSubmit}
      >
        <FormSortOrder name="order" label="Sort Order" min={0} max={99} required />
        <button type="submit">Save</button>
      </FormWrapper>
    )

    const input = screen.getByRole('spinbutton', { name: /^Sort Order/ })
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '99')
    expect(input).toHaveAttribute('step', '1')
    expect(input).toHaveAttribute('dir', 'ltr')
    await user.clear(input)
    await user.type(input, '7')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ order: 7 }), expect.anything(), expect.anything())
  })
})
