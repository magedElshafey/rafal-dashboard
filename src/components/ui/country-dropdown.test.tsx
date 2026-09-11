import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { CountryDdlOption } from '@/types/country-ddl.types'

import { CountryDropdown } from './country-dropdown'

vi.mock('react-circle-flags', () => ({
  CircleFlag: ({ countryCode }: { countryCode: string }) => <span data-testid={`flag-${countryCode}`} />,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'label.select_country': 'Select a country',
        'label.search_country': 'Search country',
        'label.no_country_found': 'No country found.',
      })[key] ?? key,
    i18n: { dir: () => 'ltr' },
  }),
}))

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

describe('CountryDropdown', () => {
  it('uses exact ISO2 identity when calling codes are duplicated and follows controlled updates', () => {
    const { rerender } = render(<CountryDropdown options={countries} selectedIso2="CA" />)
    const trigger = screen.getByRole('combobox')

    expect(trigger).toHaveTextContent('Canada')
    expect(trigger).toHaveTextContent('+1')

    rerender(<CountryDropdown options={countries} selectedIso2="US" />)

    expect(trigger).toHaveTextContent('United States')
    expect(trigger).not.toHaveTextContent('Canada')
  })

  it('returns the original complete DDL option and closes after selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CountryDropdown options={countries} selectedIso2="US" onChange={onChange} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText('Canada'))

    expect(onChange).toHaveBeenCalledWith(countries[1])
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not open while disabled', async () => {
    const user = userEvent.setup()
    render(<CountryDropdown options={countries} selectedIso2="EG" disabled />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    expect(trigger).toBeDisabled()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByPlaceholderText('Search country')).not.toBeInTheDocument()
  })

  it('supports translated search and empty states', async () => {
    const user = userEvent.setup()
    render(<CountryDropdown options={countries} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText('Search country'), 'not-a-country')

    expect(screen.getByText('No country found.')).toBeInTheDocument()
  })
})
