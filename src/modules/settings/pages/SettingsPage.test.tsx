import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { settingsService } from '@/modules/settings/api/settings.service'
import type { Settings } from '@/modules/settings/types/settings.types'
import SettingsPage from './SettingsPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

const initialSettings: Settings = {
  vatRate: 15,
  freeShippingEnabled: true,
  freeShippingThreshold: 500,
  giftWrapEnabled: true,
  giftWrapFee: 15,
  maxAddressesPerUser: 10,
  maxCartItemQuantity: 10,
  otpResendCooldownSeconds: 1,
  guestOrderVerificationMinutes: 30,
  lowStockThreshold: 5,
  returnWindowDays: 14,
}

let settings: Settings = { ...initialSettings }

function installServiceFixtures() {
  vi.spyOn(settingsService, 'get').mockImplementation(async () => ({ ...settings }))
  vi.spyOn(settingsService, 'update').mockImplementation(async (payload) => {
    settings = { ...settings, ...payload }
    return { ...settings }
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>
  )
}

describe('SettingsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    settings = { ...initialSettings }
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders a dedicated skeleton, hydrates server values, and starts pristine', async () => {
    renderPage()
    expect(screen.getByTestId('settings-form-skeleton')).toBeInTheDocument()
    expect(await screen.findByRole('spinbutton', { name: /VAT Rate/ })).toHaveValue(15)
    expect(screen.getByRole('switch', { name: 'Free Shipping' })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /Free Shipping Threshold/ })).toHaveValue(500)
    expect(screen.getByRole('spinbutton', { name: /Guest Order Verification Window/ })).toHaveValue(30)
    expect(screen.getByRole('spinbutton', { name: /Low Stock Threshold/ })).toHaveValue(5)
    expect(screen.getByRole('spinbutton', { name: /Return Window/ })).toHaveValue(14)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('shows a safe load error and retries without rendering an empty form', async () => {
    const get = vi.mocked(settingsService.get)
    const implementation = get.getMockImplementation()
    get.mockRejectedValueOnce(new Error('unsafe backend detail')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe backend detail')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: /VAT Rate/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('spinbutton', { name: /VAT Rate/ })).toHaveValue(15)
  })

  it('submits only a dirty VAT value and resets to pristine after success', async () => {
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const vat = await screen.findByRole('spinbutton', { name: /VAT Rate/ })
    await user.clear(vat)
    await user.type(vat, '20')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ vatRate: 20 }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled())
    expect(toastMocks.success).toHaveBeenCalledWith('Settings updated successfully.')
  })

  it('clears, disables, dirties, and submits both Free Shipping fields when switched off', async () => {
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const toggle = await screen.findByRole('switch', { name: 'Free Shipping' })
    const threshold = screen.getByRole('spinbutton', { name: /Free Shipping Threshold/ })
    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(threshold).toHaveValue(null)
    expect(threshold).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ freeShippingEnabled: false, freeShippingThreshold: null })
    )
  })

  it('enables Free Shipping without requiring or sending a threshold', async () => {
    settings = { ...settings, freeShippingEnabled: false, freeShippingThreshold: null }
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const toggle = await screen.findByRole('switch', { name: 'Free Shipping' })
    expect(toggle).not.toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /Free Shipping Threshold/ })).toHaveValue(null)
    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ freeShippingEnabled: true }))
  })

  it('zeroes and submits only both Gift Wrap fields when switched off', async () => {
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const toggle = await screen.findByRole('switch', { name: 'Enable Gift Wrap' })
    const fee = screen.getByRole('spinbutton', { name: /Gift Wrap Fee/ })
    await user.click(toggle)
    expect(fee).toHaveValue(0)
    expect(fee).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ giftWrapEnabled: false, giftWrapFee: 0 }))
  })

  it('enables Gift Wrap without requiring or sending a fee', async () => {
    settings = { ...settings, giftWrapEnabled: false, giftWrapFee: 0 }
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const toggle = await screen.findByRole('switch', { name: 'Enable Gift Wrap' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    const fee = screen.getByRole('spinbutton', { name: /Gift Wrap Fee/ })
    await user.clear(fee)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ giftWrapEnabled: true }))
  })

  it('disables save for invalid edits', async () => {
    const user = userEvent.setup()
    renderPage()
    const addresses = await screen.findByRole('spinbutton', { name: /Maximum Addresses/ })
    await user.clear(addresses)
    await user.type(addresses, '0')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled())
    expect(await screen.findByText('Enter a whole number of at least 1.')).toBeInTheDocument()
  })

  it('preserves edits and shows safe localized feedback when update fails', async () => {
    vi.spyOn(settingsService, 'update').mockRejectedValueOnce(new Error('database secret'))
    const user = userEvent.setup()
    renderPage()
    const cart = await screen.findByRole('spinbutton', { name: /Maximum Cart Item Quantity/ })
    await user.clear(cart)
    await user.type(cart, '12')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('Settings could not be updated. Your changes have been preserved.')
    )
    expect(cart).toHaveValue(12)
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled()
    expect(screen.queryByText('database secret')).not.toBeInTheDocument()
  })
})
