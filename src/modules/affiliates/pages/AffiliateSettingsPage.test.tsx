import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import AffiliateSettingsPage from '@/modules/affiliates/pages/AffiliateSettingsPage'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { AffiliateSettings } from '@/modules/affiliates/types/affiliate.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

const initialSettings: AffiliateSettings = {
  programEnabled: true,
  applicationsEnabled: true,
  customerDiscountPercentage: 10,
  affiliateCommissionPercentage: 10,
  minimumPayoutAmount: '100.00',
  termsPageReference: 'affiliate-terms',
  version: 1,
  updatedAt: '2026-11-21T00:00:00.000Z',
}

let settings: AffiliateSettings

function installFixtures() {
  vi.spyOn(affiliatesService, 'getSettings').mockImplementation(async () => ({ ...settings }))
  vi.spyOn(affiliatesService, 'updateSettings').mockImplementation(async (payload) => {
    settings = {
      ...settings,
      ...payload,
      version: settings.version + 1,
      updatedAt: '2026-11-21T12:00:00.000Z',
    }
    return { ...settings }
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AffiliateSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { client }
}

describe('Affiliate settings page', () => {
  beforeEach(async () => {
    settings = { ...initialSettings }
    installFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('loads and prefills all six settings with accessible controls and an unchanged disabled save', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Affiliate Programme Settings' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Programme enabled' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Applications enabled' })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: 'Customer discount percentage' })).toHaveValue(10)
    expect(screen.getByRole('spinbutton', { name: 'Affiliate commission percentage' })).toHaveValue(10)
    expect(screen.getByRole('textbox', { name: 'Minimum payout amount' })).toHaveValue('100.00')
    expect(screen.getByRole('textbox', { name: 'Affiliate terms page reference' })).toHaveValue('affiliate-terms')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.getByText(/not currently enforced by the live storefront/i)).toBeInTheDocument()
  })

  it('shows a safe initial error and retries the settings GET', async () => {
    vi.mocked(affiliatesService.getSettings).mockRejectedValueOnce(new Error('private network detail'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private network detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: 'Affiliate Programme Settings' })).toBeInTheDocument()
  })

  it('validates percentage, payout, and terms fields before PATCH', async () => {
    const user = userEvent.setup()
    renderPage()
    const percentage = await screen.findByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(percentage)
    await user.type(percentage, '101')
    expect(await screen.findByText('Enter a percentage from 0 through 100.')).toBeInTheDocument()

    const payout = screen.getByRole('textbox', { name: 'Minimum payout amount' })
    await user.clear(payout)
    await user.type(payout, '0.00')
    expect(await screen.findByText('Minimum payout amount must be greater than zero.')).toBeInTheDocument()

    const terms = screen.getByRole('textbox', { name: 'Affiliate terms page reference' })
    await user.clear(terms)
    await user.type(terms, 'Affiliate_Terms')
    expect(await screen.findByText(/Use lowercase letters, numbers, and single hyphens only/i)).toBeInTheDocument()
    expect(affiliatesService.updateSettings).not.toHaveBeenCalled()
  })

  it('sends only changed fields plus version, replaces the baseline, and leaves Affiliate caches untouched', async () => {
    const user = userEvent.setup()
    const { client } = renderPage()
    client.setQueryData(affiliatesKeys.lists(), 'preserve-list-cache')
    client.setQueryData(affiliatesKeys.detail(101), 'preserve-detail-cache')
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const percentage = await screen.findByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(percentage)
    await user.type(percentage, '12.5')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(affiliatesService.updateSettings).toHaveBeenCalledWith({
        version: 1,
        customerDiscountPercentage: 12.5,
      })
    )
    expect(client.getQueryData(affiliatesKeys.lists())).toBe('preserve-list-cache')
    expect(client.getQueryData(affiliatesKeys.detail(101))).toBe('preserve-detail-cache')
    expect(invalidate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    await user.click(screen.getByRole('switch', { name: 'Applications enabled' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(affiliatesService.updateSettings).toHaveBeenLastCalledWith({ version: 2, applicationsEnabled: false })
    )
  })

  it('keeps the editing version when a dirty draft receives newer query data', async () => {
    const conflict = Object.assign(new Error('stale'), {
      isAxiosError: true,
      response: { status: 409, data: { code: 'AFFILIATE_SETTINGS_VERSION_CONFLICT' } },
    })
    const latest: AffiliateSettings = {
      ...initialSettings,
      customerDiscountPercentage: 12,
      minimumPayoutAmount: '250.00',
      version: 2,
      updatedAt: '2026-11-21T11:00:00.000Z',
    }
    vi.mocked(affiliatesService.updateSettings).mockRejectedValueOnce(conflict)
    const user = userEvent.setup()
    const { client } = renderPage()
    const percentage = await screen.findByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(percentage)
    await user.type(percentage, '15')

    settings = latest
    client.setQueryData(affiliatesKeys.settings(), latest)
    await waitFor(() => expect(percentage).toHaveValue(15))

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(affiliatesService.updateSettings).toHaveBeenCalledWith({
        version: 1,
        customerDiscountPercentage: 15,
      })
    )
    const panel = await screen.findByRole('alert')
    expect(within(panel).getByText('250.00')).toBeInTheDocument()
    expect(percentage).toHaveValue(15)

    await user.click(within(panel).getByRole('button', { name: 'Discard changes' }))
    expect(percentage).toHaveValue(12)
    expect(screen.getByRole('textbox', { name: 'Minimum payout amount' })).toHaveValue('250.00')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('advances the accepted baseline when pristine query data changes', async () => {
    const latest: AffiliateSettings = {
      ...initialSettings,
      customerDiscountPercentage: 12,
      version: 2,
      updatedAt: '2026-11-21T11:00:00.000Z',
    }
    const user = userEvent.setup()
    const { client } = renderPage()
    const percentage = await screen.findByRole('spinbutton', { name: 'Customer discount percentage' })

    settings = latest
    client.setQueryData(affiliatesKeys.settings(), latest)
    await waitFor(() => expect(percentage).toHaveValue(12))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    const commission = screen.getByRole('spinbutton', { name: 'Affiliate commission percentage' })
    await user.clear(commission)
    await user.type(commission, '14')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(affiliatesService.updateSettings).toHaveBeenCalledWith({
        version: 2,
        affiliateCommissionPercentage: 14,
      })
    )
  })

  it('maps backend validation and preserves drafts after API or network failures', async () => {
    const validation = Object.assign(new Error('unsafe validation'), {
      isAxiosError: true,
      response: { status: 422, data: { errors: { terms_page_reference: ['invalid'] } } },
    })
    vi.mocked(affiliatesService.updateSettings)
      .mockRejectedValueOnce(validation)
      .mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderPage()
    const terms = await screen.findByRole('textbox', { name: 'Affiliate terms page reference' })
    await user.clear(terms)
    await user.type(terms, 'new-affiliate-terms')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Review this field and try again.')).toBeInTheDocument()
    expect(terms).toHaveValue('new-affiliate-terms')

    await user.type(terms, '-v2')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalled())
    expect(terms).toHaveValue('new-affiliate-terms-v2')
  })

  it('preserves the draft on 409, shows refreshed values, and retries explicitly with the latest version', async () => {
    const conflict = Object.assign(new Error('stale'), {
      isAxiosError: true,
      response: { status: 409, data: { code: 'AFFILIATE_SETTINGS_VERSION_CONFLICT', errors: { version: ['stale'] } } },
    })
    const latest: AffiliateSettings = {
      ...initialSettings,
      customerDiscountPercentage: 11,
      minimumPayoutAmount: '250.00',
      version: 2,
      updatedAt: '2026-11-21T11:00:00.000Z',
    }
    vi.mocked(affiliatesService.getSettings)
      .mockResolvedValueOnce({ ...initialSettings })
      .mockResolvedValue({ ...latest })
    vi.mocked(affiliatesService.updateSettings)
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce({ ...latest, customerDiscountPercentage: 15, version: 3 })
    const user = userEvent.setup()
    renderPage()
    const percentage = await screen.findByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(percentage)
    await user.type(percentage, '15')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    const panel = await screen.findByRole('alert')
    expect(within(panel).getByText('Settings changed by another administrator')).toBeInTheDocument()
    expect(within(panel).getByText('250.00')).toBeInTheDocument()
    expect(percentage).toHaveValue(15)
    expect(percentage).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Minimum payout amount' })).toBeDisabled()
    expect(affiliatesService.updateSettings).toHaveBeenCalledTimes(1)

    await user.click(within(panel).getByRole('button', { name: 'Retry my changes' }))
    await waitFor(() =>
      expect(affiliatesService.updateSettings).toHaveBeenLastCalledWith({
        version: 2,
        customerDiscountPercentage: 15,
      })
    )
    expect(affiliatesService.updateSettings).toHaveBeenCalledTimes(2)
    expect(await screen.findByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('supports discard plus Arabic RTL and LTR numeric inputs', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()
    const percentage = await screen.findByRole('spinbutton', { name: 'نسبة خصم العميل' })
    expect(percentage).toHaveAttribute('dir', 'ltr')
    await user.clear(percentage)
    await user.type(percentage, '20')
    expect(screen.getByRole('button', { name: 'حفظ التغييرات' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'تجاهل التغييرات' }))
    expect(percentage).toHaveValue(10)
    expect(screen.getByRole('button', { name: 'حفظ التغييرات' })).toBeDisabled()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })
})
