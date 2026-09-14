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

HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

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

function TypedSelectHarness() {
  const methods = useForm<{ parentId: number | null }>({ defaultValues: { parentId: null } })
  const parentId = useWatch({ control: methods.control, name: 'parentId' })
  return (
    <FormProvider {...methods}>
      <FormSelect
        name="parentId"
        label="Parent"
        data={[
          { value: 'root', label: 'Root' },
          { value: '12', label: 'Category 12' },
        ]}
        valueKey="value"
        labelKey="label"
        serializeValue={(value) => (value === null ? 'root' : String(value))}
        deserializeValue={(value) => (value === 'root' ? null : Number(value))}
      />
      <output aria-label="selected parent">{parentId === null ? 'null' : `${parentId}:${typeof parentId}`}</output>
    </FormProvider>
  )
}

function FailedRemoteSelectHarness({ onRetry }: { onRetry: () => void }) {
  const methods = useForm({ defaultValues: { parentId: '' } })
  return (
    <FormProvider {...methods}>
      <FormSelect
        name="parentId"
        label="Parent"
        data={[]}
        valueKey="value"
        labelKey="label"
        isError
        errorMessage="Parents could not be loaded"
        retryLabel="Retry parents"
        onRetry={onRetry}
      />
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

  it('supports typed domain values without storing transport strings', async () => {
    const user = userEvent.setup()
    render(<TypedSelectHarness />)
    expect(screen.getByRole('combobox', { name: 'Parent' })).toHaveTextContent('Root')
    await user.click(screen.getByRole('combobox', { name: 'Parent' }))
    await user.click(screen.getByRole('option', { name: 'Category 12' }))
    expect(screen.getByRole('status', { name: 'selected parent' })).toHaveTextContent('12:number')
  })

  it('keeps remote failures inside the menu and exposes a retry action', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<FailedRemoteSelectHarness onRetry={onRetry} />)

    await user.click(screen.getByRole('combobox', { name: 'Parent' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Parents could not be loaded')
    await user.click(screen.getByRole('button', { name: 'Retry parents' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
