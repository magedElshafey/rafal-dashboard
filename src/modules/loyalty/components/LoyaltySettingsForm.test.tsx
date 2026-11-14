import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import loyaltyAr from '@/modules/loyalty/locale/ar.json'
import type { LoyaltySettings } from '@/modules/loyalty/types/loyalty.types'
import { LoyaltySettingsForm } from './LoyaltySettingsForm'

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
  savedAt: '2026-11-11T21:30:08+03:00',
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

describe('LoyaltySettingsForm', () => {
  beforeEach(async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    await i18n.changeLanguage('en')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows the documented preview and confirms disabling before sending confirm_disable', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue({ ...settings, versionId: 28, isEnabled: false })
    render(
      <LoyaltySettingsForm settings={settings} isSubmitting={false} onSubmit={onSubmit} onReloadConflict={vi.fn()} />
    )

    expect(screen.getByText(/500 SAR earns 50 points worth 2.5 SAR \(0.5% return\)/)).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Enable loyalty programme' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Disable programme' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ versionId: 27, isEnabled: false, confirmDisable: true })
      )
    )
  })

  it('renders null settings as empty required inputs and submits only after valid values are entered', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onSubmit = vi.fn().mockResolvedValue({
      ...initialSettings,
      versionId: 1,
      validityMonths: 12,
      expiryWarningDays: 27,
    })
    const { container } = render(
      <LoyaltySettingsForm
        settings={initialSettings}
        isSubmitting={false}
        onSubmit={onSubmit}
        onReloadConflict={vi.fn()}
      />
    )

    expect(screen.getByText('Not launched yet')).toBeInTheDocument()
    const validity = screen.getByRole('spinbutton', { name: 'Point validity (months)' })
    const warning = screen.getByRole('spinbutton', { name: 'Expiry warning (days)' })
    expect(validity).toHaveValue(null)
    expect(warning).toHaveValue(null)
    expect(container.innerHTML).not.toContain('NaN')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.type(validity, '12')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.type(warning, '27')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ versionId: null, validityMonths: 12, expiryWarningDays: 27 })
      )
    )
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('preserves edits on a version conflict and reloads only on explicit action', async () => {
    const user = userEvent.setup()
    const onReloadConflict = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 409 } })
    const { rerender } = render(
      <LoyaltySettingsForm
        settings={settings}
        isSubmitting={false}
        onSubmit={onSubmit}
        onReloadConflict={onReloadConflict}
      />
    )

    const amount = screen.getByRole('spinbutton', { name: 'Purchase amount per point (SAR)' })
    await user.clear(amount)
    await user.type(amount, '12')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Your edits are preserved')
    expect(amount).toHaveValue(12)
    expect(onReloadConflict).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Reload latest settings' }))
    expect(onReloadConflict).toHaveBeenCalledOnce()
    rerender(
      <LoyaltySettingsForm
        settings={{ ...settings, versionId: 28, amountPerPoint: '13.00' }}
        isSubmitting={false}
        onSubmit={onSubmit}
        onReloadConflict={onReloadConflict}
      />
    )
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it.each([
    [9.99, false],
    [10, false],
    [10.01, true],
  ])('shows the informational high-return warning for %s%% only when above 10%%', (redeemAmount, expected) => {
    render(
      <LoyaltySettingsForm
        settings={{ ...settings, amountPerPoint: '1.00', redeemPoints: 100, redeemAmount: String(redeemAmount) }}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onReloadConflict={vi.fn()}
      />
    )

    expect(Boolean(screen.queryByRole('status'))).toBe(expected)
  })

  it('updates the warning reactively and does not block saving', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(settings)
    render(
      <LoyaltySettingsForm
        settings={{ ...settings, amountPerPoint: '1.00', redeemPoints: 100, redeemAmount: '10.00' }}
        isSubmitting={false}
        onSubmit={onSubmit}
        onReloadConflict={vi.fn()}
      />
    )
    const redeemAmount = screen.getByRole('spinbutton', { name: 'Redemption value — amount (SAR)' })

    await user.clear(redeemAmount)
    await user.type(redeemAmount, '10.01')

    expect(await screen.findByRole('status')).toHaveTextContent('return greater than 10%')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
  })

  it('uses Arabic labels and the document RTL direction', async () => {
    await i18n.changeLanguage('ar')
    render(
      <LoyaltySettingsForm
        settings={{ ...settings, amountPerPoint: '1.00', redeemPoints: 100, redeemAmount: '10.01' }}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onReloadConflict={vi.fn()}
      />
    )

    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByRole('switch', { name: 'تفعيل برنامج الولاء' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'حفظ' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(loyaltyAr.loyalty.preview.highReturnWarning)
  })
})
