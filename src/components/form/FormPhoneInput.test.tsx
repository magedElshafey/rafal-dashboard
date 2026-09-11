import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { CountryDdlOption } from '@/types/country-ddl.types'

import { FormPhoneInput, type FormPhoneInputProps } from './FormPhoneInput'

vi.mock('react-circle-flags', () => ({
  CircleFlag: ({ countryCode }: { countryCode: string }) => <span data-testid={`flag-${countryCode}`} />,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'label.phone': 'Phone',
        'label.phone_placeholder': 'Enter your phone number',
        'label.select_country': 'Select a country',
        'label.search_country': 'Search country',
        'label.no_country_found': 'No country found.',
      })[key] ?? key,
    i18n: { dir: () => 'ltr' },
  }),
}))

type PhoneValues = {
  phone: string
  country_code: string
}

const countries: CountryDdlOption[] = [
  { value: 'us', label: 'United States', iso2: 'US', phone_code: '+1' },
  { value: 'ca', label: 'Canada', iso2: 'CA', phone_code: '+1' },
  { value: 'eg', label: 'Egypt', iso2: 'EG', phone_code: '+20' },
]

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

function PhoneHarness(props: Partial<FormPhoneInputProps>) {
  const methods = useForm<PhoneValues>({
    defaultValues: { phone: '', country_code: '+1' },
  })
  const countryCode = useWatch({ control: methods.control, name: 'country_code' })

  return (
    <FormProvider {...methods}>
      <FormPhoneInput phoneName="phone" countryName="country_code" {...props} />
      <output aria-label="country code">{countryCode}</output>
      <button
        type="button"
        onClick={() => {
          methods.setError('phone', { message: 'Phone is required' })
          methods.setError('country_code', { message: 'Country is required' })
        }}
      >
        Show errors
      </button>
    </FormProvider>
  )
}

describe('FormPhoneInput', () => {
  it('renders one accessible field group with translated defaults and tel-national autocomplete', () => {
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" />)

    const group = screen.getByRole('group', { name: 'Phone' })
    const input = screen.getByRole('textbox', { name: 'Phone' })

    expect(group).toBeInTheDocument()
    expect(input).toHaveAttribute('autocomplete', 'tel-national')
    expect(input).toHaveAttribute('placeholder', 'Enter your phone number')
    expect(screen.getByRole('combobox', { name: 'Select a country' })).toHaveTextContent('+1')
    expect(screen.getByTestId('flag-us')).toBeInTheDocument()
  })

  it('propagates disabled state to both controls', () => {
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" disabled />)

    expect(screen.getByRole('textbox', { name: 'Phone' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Select a country' })).toBeDisabled()
  })

  it('exposes required state on the calling-code and phone controls', () => {
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" required />)

    expect(screen.getByRole('textbox', { name: 'Phone' })).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('combobox', { name: 'Select a country' })).toHaveAttribute('aria-required', 'true')
  })

  it('returns the exact selected DDL option while updating the calling-code field', async () => {
    const user = userEvent.setup()
    const onCountryChange = vi.fn()
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" onCountryChange={onCountryChange} />)

    await user.click(screen.getByRole('combobox', { name: 'Select a country' }))
    await user.click(screen.getByText('Egypt'))

    expect(onCountryChange).toHaveBeenCalledWith(countries[2])
    expect(screen.getByRole('status', { name: 'country code' })).toHaveTextContent('+20')
  })

  it('keeps the entered phone unchanged when the calling-code country changes', async () => {
    const user = userEvent.setup()
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" />)

    const phone = screen.getByRole('textbox', { name: 'Phone' })
    await user.type(phone, '1012345678')
    await user.click(screen.getByRole('combobox', { name: 'Select a country' }))
    await user.click(screen.getByText('Egypt'))

    expect(phone).toHaveValue('1012345678')
    expect(screen.getByRole('status', { name: 'country code' })).toHaveTextContent('+20')
  })

  it('announces only one validation message and describes both controls with it', async () => {
    const user = userEvent.setup()
    render(<PhoneHarness countryOptions={countries} selectedCountryIso2="US" />)

    await user.click(screen.getByRole('button', { name: 'Show errors' }))

    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toHaveTextContent('Phone is required')
    expect(screen.getByRole('textbox', { name: 'Phone' })).toHaveAttribute('aria-describedby', alerts[0].id)
    expect(screen.getByRole('combobox', { name: 'Select a country' })).toHaveAttribute('aria-describedby', alerts[0].id)
  })
})
