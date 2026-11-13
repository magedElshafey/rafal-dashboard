import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type {
  LoyaltySettings,
  LoyaltySettingsVersion,
  LoyaltyVersionsPage,
} from '@/modules/loyalty/types/loyalty.types'
import LoyaltySettingsPage from './LoyaltySettingsPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const settings: LoyaltySettings = {
  versionId: 27,
  isEnabled: true,
  amountPerPoint: '10.00',
  redeemPoints: 100,
  redeemAmount: '5.00',
  maxRedeemPercent: 50,
  minRedeemPoints: 100,
  validityMonths: 12,
  expiryWarningDays: 30,
  valuePerPoint: 0.05,
  effectiveReturnPercent: 0.5,
  launchDate: '2026-11-11T21:23:22+03:00',
  savedAt: '2026-11-13T17:23:02+03:00',
}

const initialSettings: LoyaltySettings = {
  ...settings,
  versionId: null,
  isEnabled: false,
  validityMonths: null,
  expiryWarningDays: null,
  launchDate: null,
  savedAt: null,
}

const values: LoyaltySettingsVersion['values'] = {
  isEnabled: true,
  amountPerPoint: '10.00',
  redeemPoints: 100,
  redeemAmount: '5.00',
  maxRedeemPercent: 50,
  minRedeemPoints: 100,
  validityMonths: 12,
  expiryWarningDays: 30,
  effectiveReturnPercent: 0.5,
}

function versionsPage(items: LoyaltySettingsVersion[]): LoyaltyVersionsPage {
  return {
    items,
    meta: { current_page: 1, last_page: 1, per_page: 20, total: items.length },
  }
}

function historyVersion(id: number, amountPerPoint = '10.00'): LoyaltySettingsVersion {
  return {
    id,
    savedAt: '2026-11-13T17:23:02+03:00',
    admin: { id: 1, name: 'Admin' },
    values: { ...values, amountPerPoint },
    previousValues: id === 1 ? null : { ...values },
  }
}

function LocationControls() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
    </>
  )
}

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 5 * 60 * 1000, gcTime: Infinity, refetchOnMount: false },
      mutations: { retry: false },
    },
  })
}

function renderPage(entry = '/dashboard/loyalty/settings', client = createClient()) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[entry]}>
          <LoyaltySettingsPage />
          <LocationControls />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}

describe('LoyaltySettingsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    await i18n.changeLanguage('en')
    vi.spyOn(loyaltyService, 'getSettings').mockResolvedValue(settings)
    vi.spyOn(loyaltyService, 'getVersions').mockResolvedValue(versionsPage([historyVersion(1)]))
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['/dashboard/loyalty/settings', '/dashboard/loyalty/settings'],
    ['/dashboard/loyalty/settings?tab=settings', '/dashboard/loyalty/settings?tab=settings'],
    ['/dashboard/loyalty/settings?tab=unknown', '/dashboard/loyalty/settings?tab=unknown'],
  ])('defaults %s to the Settings tab', async (entry, expectedLocation) => {
    const versions = vi.mocked(loyaltyService.getVersions)
    renderPage(entry)

    expect(await screen.findByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('location')).toHaveTextContent(expectedLocation)
    expect(versions).not.toHaveBeenCalled()
  })

  it('opens a direct History URL and preserves it on initial render', async () => {
    const versions = vi.mocked(loyaltyService.getVersions)
    renderPage('/dashboard/loyalty/settings?tab=history')

    expect(await screen.findByRole('tab', { name: 'Change history' })).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(versions).toHaveBeenCalledExactlyOnceWith(20, expect.any(AbortSignal)))
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/loyalty/settings?tab=history')
  })

  it('preserves unrelated parameters and supports browser Back and Forward navigation', async () => {
    const user = userEvent.setup()
    renderPage('/dashboard/loyalty/settings?source=notification')
    await screen.findByRole('tab', { name: 'Settings' })

    await user.click(screen.getByRole('tab', { name: 'Change history' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('source=notification&tab=history'))
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('source=notification&tab=settings'))

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Change history' })).toHaveAttribute('aria-selected', 'true')
    )
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true'))
    await user.click(screen.getByRole('button', { name: 'Forward' }))
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Change history' })).toHaveAttribute('aria-selected', 'true')
    )
  })

  it('fetches History once on first open and reuses a still-fresh cached result', async () => {
    const user = userEvent.setup()
    const versions = vi.mocked(loyaltyService.getVersions)
    renderPage()

    await user.click(await screen.findByRole('tab', { name: 'Change history' }))
    await waitFor(() => expect(versions).toHaveBeenCalledOnce())
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    await user.click(screen.getByRole('tab', { name: 'Change history' }))
    await waitFor(() => expect(screen.getAllByText('Initial configuration')).not.toHaveLength(0))
    expect(versions).toHaveBeenCalledOnce()
  })

  it('refetches invalidated inactive History after a save and shows the new server version', async () => {
    const user = userEvent.setup()
    const updatedSettings = { ...settings, versionId: 28, amountPerPoint: '11.50' }
    const versions = vi
      .mocked(loyaltyService.getVersions)
      .mockResolvedValueOnce(versionsPage([historyVersion(1)]))
      .mockResolvedValueOnce(versionsPage([historyVersion(2, '11.50'), historyVersion(1)]))
    vi.spyOn(loyaltyService, 'updateSettings').mockResolvedValue(updatedSettings)
    const { client } = renderPage()

    await user.click(await screen.findByRole('tab', { name: 'Change history' }))
    await waitFor(() => expect(versions).toHaveBeenCalledOnce())
    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    const amount = await screen.findByRole('spinbutton', { name: 'Purchase amount per point (SAR)' })
    await user.clear(amount)
    await user.type(amount, '11.5')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(client.getQueryData(loyaltyKeys.settings())).toEqual(updatedSettings))

    await user.click(screen.getByRole('tab', { name: 'Change history' }))
    await waitFor(() => expect(versions).toHaveBeenCalledTimes(2))
    expect(await screen.findAllByText('11.50 SAR')).not.toHaveLength(0)
    expect(versions).toHaveBeenCalledTimes(2)
  })

  it('keeps nullable initial settings behavior on the URL-backed Settings tab', async () => {
    vi.mocked(loyaltyService.getSettings).mockResolvedValue(initialSettings)
    renderPage('/dashboard/loyalty/settings?tab=settings')

    expect(await screen.findByText('Not launched yet')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Point validity (months)' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Expiry warning (days)' })).toHaveValue(null)
  })
})
