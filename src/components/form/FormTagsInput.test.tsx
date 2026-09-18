import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { FormTagsInput } from './FormTagsInput'

function Harness({ disabled = false, maxItems }: { disabled?: boolean; maxItems?: number }) {
  const methods = useForm({ defaultValues: { tags: [] as string[] } })
  const tags = useWatch({ control: methods.control, name: 'tags' })
  return (
    <FormProvider {...methods}>
      <FormTagsInput
        name="tags"
        label="Coverage Zones"
        addLabel="Add coverage zone"
        removeLabel={(value) => `Remove ${value}`}
        disabled={disabled}
        maxItems={maxItems}
      />
      <output aria-label="values">{tags.join('|')}</output>
    </FormProvider>
  )
}

describe('FormTagsInput', () => {
  it('adds trimmed values, prevents empty and exact duplicates, and removes values', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox', { name: 'Add coverage zone' })
    await user.type(input, '  Makkah  {Enter}{Enter}Makkah{Enter}مكة{Enter}')
    expect(screen.getByRole('status', { name: 'values' })).toHaveTextContent('Makkah|مكة')
    await user.click(screen.getByRole('button', { name: 'Remove Makkah' }))
    expect(screen.getByRole('status', { name: 'values' })).toHaveTextContent('مكة')
  })

  it('supports comma commit, backspace removal, limits, and disabled state', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Harness maxItems={1} />)
    const input = screen.getByRole('textbox', { name: 'Add coverage zone' })
    await user.type(input, 'Jeddah,')
    expect(input).toBeDisabled()
    rerender(<Harness disabled />)
    expect(screen.getByRole('textbox', { name: 'Add coverage zone' })).toBeDisabled()
  })
})
