import { cn } from '@/lib/utils'
import { badgeVariants } from '@/components/ui/badge'
import { act, cleanup, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '@/lang/en.json'
import { RemainingTimeBadge } from './RemainingTimeBadge'

describe('RemainingTimeBadge shared clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T08:00:00Z'))
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  async function setup(target: number, upcoming = true, count = 1) {
    const i18n = createInstance()
    await i18n.init({ lng: 'en', resources: { en: { translation: en } } })
    return render(
      <I18nextProvider i18n={i18n}>
        {Array.from({ length: count }, (_, id) => (
          <RemainingTimeBadge key={id} target={target} isUpcoming={upcoming} />
        ))}
      </I18nextProvider>
    )
  }

  it('does not infer upcoming from a future timestamp alone', async () => {
    const { container } = await setup(Date.now() + 86400000, false)
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('updates warning to error exactly at 24h with one timer for many cards', async () => {
    const { unmount } = await setup(Date.now() + 86430000, true, 25)
    expect(screen.getAllByText('1 day, 0h 0m left')[0]).toHaveClass(cn(badgeVariants({ variant: 'warning' })))
    expect(vi.getTimerCount()).toBe(1)
    act(() => vi.advanceTimersByTime(30000))
    expect(screen.getAllByText('1 day, 0h 0m left')[0]).toHaveClass(cn(badgeVariants({ variant: 'error' })))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('disappears at the exact target and updates on returning to the page', async () => {
    const { container } = await setup(Date.now() + 30000)
    expect(screen.getByText('Less than 1m left')).toBeVisible()
    act(() => vi.advanceTimersByTime(30000))
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
  })
  it('refreshes time on focus without a request', async () => {
    const { container } = await setup(Date.now() + 60000)
    act(() => {
      vi.setSystemTime(Date.now() + 120000)
      window.dispatchEvent(new Event('focus'))
    })
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
  })
})
