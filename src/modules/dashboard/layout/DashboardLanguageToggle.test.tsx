import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import env from '@/config/env'
import i18n from '@/config/i18'
import { DashboardLanguageToggle } from '@/modules/dashboard/layout/DashboardLanguageToggle'

describe('DashboardLanguageToggle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('uses Arabic as the configured default and synchronizes language and direction', async () => {
    expect(env.DEFAULT_LOCALE).toBe('ar')
    render(<DashboardLanguageToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Arabic' }))

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'ar')
      expect(document.documentElement).toHaveAttribute('dir', 'rtl')
      expect(localStorage.getItem(env.LOCALE_KEY)).toBe('ar')
    })
  })
})
