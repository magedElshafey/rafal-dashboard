import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { FormSelect } from './FormSelect'

vi.mock('@/hooks/useRtl', () => ({ useRtl: () => ({ isRtl: false }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'label.clear_selection' ? 'Clear selection' : key),
    i18n: { dir: () => 'ltr' },
  }),
}))

function SelectHarness() {
  const methods = useForm({ defaultValues: { country: 'eg' } })
  const country = useWatch({ control: methods.control, name: 'country' })

  return (
    <FormProvider {...methods}>
      <FormSelect
        name="country"
        label="Country"
        data={[{ value: 'eg', label: 'Egypt' }]}
        valueKey="value"
        labelKey="label"
        clearable
      />
      <output aria-label="selected country">{country}</output>
    </FormProvider>
  )
}

describe('FormSelect clearable option', () => {
  it('clears an optional selection through a separate keyboard-accessible control', async () => {
    const user = userEvent.setup()
    render(<SelectHarness />)

    const clear = screen.getByRole('button', { name: 'Clear selection' })
    expect(screen.getByRole('combobox', { name: 'Country' })).not.toContainElement(clear)

    await user.click(clear)
    expect(screen.getByRole('status', { name: 'selected country' })).toHaveTextContent('')
  })
})
