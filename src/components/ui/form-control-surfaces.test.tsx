import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { FileUploadBox } from '@/components/form/file-upload/FileUploadBox'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { Combobox } from '@/components/ui/combobox'
import { Command, CommandInput } from '@/components/ui/command'
import { DatePicker } from '@/components/ui/datePicker'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'label.search': 'Search',
        'label.no_data': 'No data',
        'label.no_results': 'No results',
        'label.select_all': 'Select all',
        'label.clear_selection': 'Clear selection',
        'label.more': 'more',
        'label.select_date': 'Select date',
        'label.clear_date': 'Clear date',
        'label.show_password': 'Show password',
        'label.hide_password': 'Hide password',
      })[key] ?? key,
    i18n: { dir: () => 'ltr' },
  }),
}))

function PasswordHarness() {
  const methods = useForm({ defaultValues: { password: '' } })
  return (
    <FormProvider {...methods}>
      <FormPasswordInput name="password" label="Password" disabled required />
    </FormProvider>
  )
}

describe('shared form-control surfaces', () => {
  it('applies the default, focus, error, disabled, and read-only states to Input', () => {
    render(<Input aria-label="Name" disabled readOnly aria-invalid="true" />)
    const field = screen.getByLabelText('Name').closest('[data-slot="input-container"]')

    expect(field).toHaveClass('border-black-50', 'bg-black-50', 'focus-within:border-brand-500')
    expect(field).toHaveClass('has-[input[aria-invalid=true]]:border-error-500')
    expect(field).toHaveClass('has-[input:disabled]:bg-black-100', 'has-[input:read-only]:bg-black-100')
  })

  it('applies deterministic state classes to Textarea and SelectTrigger', () => {
    render(
      <>
        <Textarea aria-label="Notes" aria-invalid="true" disabled />
        <Select>
          <SelectTrigger aria-label="Status" aria-invalid="true" disabled>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      </>
    )

    expect(screen.getByLabelText('Notes')).toHaveClass(
      'border-black-50',
      'bg-black-50',
      'focus-visible:border-brand-500',
      'aria-invalid:border-error-500',
      'disabled:bg-black-100'
    )
    expect(screen.getByLabelText('Status')).toHaveClass(
      'border-black-50',
      'bg-black-50',
      'focus-visible:border-brand-500',
      'aria-invalid:border-error-500',
      'disabled:bg-black-100'
    )
  })

  it('uses field surfaces for DatePicker, Combobox, MultiSelect, and command search', () => {
    render(
      <>
        <DatePicker label="Birthday" disabled aria-invalid="true" />
        <Combobox
          aria-label="City"
          data={[{ value: 'cairo', label: 'Cairo' }]}
          valueKey="value"
          labelKey="label"
          placeholder="Select city"
        />
        <MultiSelect
          aria-label="Groups"
          data={[{ value: 'one', label: 'One' }]}
          valueKey="value"
          labelKey="label"
          placeholder="Select groups"
        />
        <Command>
          <CommandInput surface="field" aria-label="Search records" />
        </Command>
      </>
    )

    expect(screen.getByLabelText('Birthday')).toHaveClass('border-black-50', 'bg-black-50', 'disabled:bg-black-100')
    expect(screen.getByLabelText('City')).toHaveClass('border-black-50', 'bg-black-50')
    expect(screen.getByLabelText('Groups')).toHaveClass('border-border', 'bg-background', 'focus-visible:border-ring')
    expect(screen.getByLabelText('Search records').closest('[data-slot="command-input-wrapper"]')).toHaveClass(
      'border-black-50',
      'bg-black-50',
      'focus-within:border-brand-500'
    )
  })

  it('keeps DatePicker IDs unique and the clear action outside its trigger', () => {
    render(
      <>
        <DatePicker label="Start date" />
        <DatePicker label="End date" value={new Date(2026, 0, 2)} onChange={vi.fn()} />
      </>
    )

    const start = screen.getByLabelText('Start date')
    const end = screen.getByLabelText('End date')
    const clear = screen.getByRole('button', { name: 'Clear date' })

    expect(start.id).not.toBe(end.id)
    expect(end).not.toContainElement(clear)
  })

  it('applies field tokens to password and file controls', () => {
    const { container } = render(
      <>
        <PasswordHarness />
        <FileUploadBox files={[]} onFilesChange={vi.fn()} disabled />
      </>
    )

    expect(screen.getByLabelText(/^Password/).closest('[data-slot="input-container"]')).toHaveClass(
      'border-black-50',
      'bg-black-50'
    )
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled()
    expect(screen.getByLabelText(/^Password/)).toBeRequired()
    expect(container.querySelector('[aria-disabled="true"]')).toHaveClass('border-black-100', 'bg-black-100')
  })
})
