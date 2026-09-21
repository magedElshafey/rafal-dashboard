import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { settingsService } from '@/modules/settings/api/settings.service'
import { resetSettingsMock } from '@/modules/settings/mocks/settings.mock'
import SettingsPage from './SettingsPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

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
    resetSettingsMock()
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
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('shows a safe load error and retries without rendering an empty form', async () => {
    const originalGet = settingsService.get
    vi.spyOn(settingsService, 'get')
      .mockRejectedValueOnce(new Error('unsafe backend detail'))
      .mockImplementation(originalGet)
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

  it('zeroes, disables, dirties, and submits both Free Shipping fields when switched off', async () => {
    const update = vi.spyOn(settingsService, 'update')
    const user = userEvent.setup()
    renderPage()
    const toggle = await screen.findByRole('switch', { name: 'Free Shipping' })
    const threshold = screen.getByRole('spinbutton', { name: /Free Shipping Threshold/ })
    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(threshold).toHaveValue(0)
    expect(threshold).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ freeShippingEnabled: false, freeShippingThreshold: 0 }))
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
