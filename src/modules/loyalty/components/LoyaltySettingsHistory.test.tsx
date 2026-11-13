import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import type { LoyaltySettingsVersion, LoyaltyVersionsPage } from '@/modules/loyalty/types/loyalty.types'
import { LoyaltySettingsHistory } from './LoyaltySettingsHistory'

const mocks = vi.hoisted(() => ({ useLoyaltyVersions: vi.fn() }))

vi.mock('@/modules/loyalty/hooks/useLoyaltyVersions', () => ({
  useLoyaltyVersions: mocks.useLoyaltyVersions,
}))

const baseValues: LoyaltySettingsVersion['values'] = {
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

function version(overrides: Partial<LoyaltySettingsVersion>): LoyaltySettingsVersion {
  return {
    id: 1,
    savedAt: '2026-11-13T17:23:02+03:00',
    admin: { id: 1, name: 'Admin' },
    values: baseValues,
    previousValues: null,
    ...overrides,
  }
}

function renderHistory(items: LoyaltySettingsVersion[]) {
  const data: LoyaltyVersionsPage = {
    items,
    meta: { current_page: 1, last_page: 1, per_page: 20, total: items.length },
  }
  mocks.useLoyaltyVersions.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    isRefetchError: false,
    isPaused: false,
    isFetching: false,
    refetch: vi.fn(),
  })
  return render(<LoyaltySettingsHistory />)
}

describe('LoyaltySettingsHistory', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    document.documentElement.dir = 'ltr'
  })

  afterEach(() => {
    mocks.useLoyaltyVersions.mockReset()
    document.documentElement.removeAttribute('dir')
  })

  it('presents an initial configuration without implying previous values', () => {
    renderHistory([version({})])

    expect(screen.getAllByText('Initial configuration')).toHaveLength(2)
    expect(screen.queryByRole('columnheader', { name: 'Previous' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Configured value' })).toBeInTheDocument()
    expect(screen.getAllByText('10.00 SAR')).not.toHaveLength(0)
    expect(screen.getAllByText('50%')).not.toHaveLength(0)
    expect(screen.getAllByText('Enabled')).not.toHaveLength(0)
    expect(screen.getAllByText('100 points')).not.toHaveLength(0)
    expect(screen.getAllByText('12 months')).not.toHaveLength(0)
    expect(screen.getAllByText('30 days')).not.toHaveLength(0)
  })

  it('shows a concise message for an identical version', () => {
    renderHistory([version({ previousValues: { ...baseValues } })])

    expect(screen.getAllByText('Saved without changes')).toHaveLength(2)
    expect(screen.queryByRole('table', { name: 'Settings value comparison' })).not.toBeInTheDocument()
  })

  it('shows only changed fields with localized null transitions and prominent updated values', () => {
    renderHistory([
      version({
        values: {
          ...baseValues,
          amountPerPoint: '11.50',
          maxRedeemPercent: 75,
          validityMonths: 12,
          expiryWarningDays: null,
        },
        previousValues: {
          ...baseValues,
          validityMonths: null,
          expiryWarningDays: 30,
        },
      }),
    ])

    const comparison = screen.getByRole('table', { name: 'Settings value comparison' })
    expect(within(comparison).getByRole('columnheader', { name: 'Previous' })).toBeInTheDocument()
    expect(within(comparison).getByRole('columnheader', { name: 'Updated' })).toBeInTheDocument()
    expect(within(comparison).getByText('10.00 SAR')).toBeInTheDocument()
    expect(within(comparison).getByText('11.50 SAR')).toHaveClass('font-semibold')
    expect(within(comparison).getByText('50%')).toBeInTheDocument()
    expect(within(comparison).getByText('75%')).toBeInTheDocument()
    expect(within(comparison).getAllByText('Unavailable')).toHaveLength(2)
    expect(within(comparison).queryByText('Redemption points')).not.toBeInTheDocument()
    expect(comparison).not.toHaveTextContent('→')
  })

  it('uses Arabic labels, digits, and bidirectional isolation in RTL', async () => {
    await i18n.changeLanguage('ar')
    document.documentElement.dir = 'rtl'
    renderHistory([
      version({
        values: { ...baseValues, amountPerPoint: '11.50' },
        previousValues: { ...baseValues },
      }),
    ])

    const comparison = screen.getByRole('table', { name: 'مقارنة قيم الإعدادات' })
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(within(comparison).getByRole('columnheader', { name: 'القيمة السابقة' })).toBeInTheDocument()
    expect(within(comparison).getByRole('columnheader', { name: 'القيمة المحدّثة' })).toBeInTheDocument()
    expect(within(comparison).getByText('10.00 SAR').tagName).toBe('BDI')
    expect(within(comparison).getByText('11.50 SAR').tagName).toBe('BDI')
  })
})
