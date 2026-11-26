import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/config/i18'
import i18n from '@/config/i18'
import { affiliatesService } from '../api/affiliates.service'
import { AffiliateExportButton } from './AffiliateExportButton'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Affiliate CSV browser download wiring (local DOM)', () => {
  it.each([
    [undefined, 'affiliates.csv'],
    ['attachment; filename="filtered.csv"', 'filtered.csv'],
    ["attachment; filename*=UTF-8''filtered%20affiliates.csv", 'filtered affiliates.csv'],
  ])('downloads once with disposition %s and cleans up the object URL', async (disposition, filename) => {
    await i18n.changeLanguage('en')
    const blob = new Blob(['code\nTEST'], { type: 'text/csv' })
    vi.spyOn(affiliatesService, 'export').mockResolvedValue({
      data: blob,
      headers: disposition ? { 'content-disposition': disposition } : {},
    } as Awaited<ReturnType<typeof affiliatesService.export>>)
    const createObjectURL = vi.fn(() => 'blob:affiliate-export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.isConnected).toBe(true)
    })
    const filters = { search: 'TEST', status: 'active' as const }
    render(<AffiliateExportButton filters={filters} />)
    await userEvent.click(screen.getByRole('button', { name: i18n.t('affiliates.actions.export') }))
    expect(affiliatesService.export).toHaveBeenCalledExactlyOnceWith(filters, expect.any(AbortSignal))
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    const downloaded = click.mock.contexts[0]
    expect(downloaded).toBeInstanceOf(HTMLAnchorElement)
    if (!(downloaded instanceof HTMLAnchorElement)) throw new Error('Missing download anchor')
    expect(downloaded.download).toBe(filename)
    expect(downloaded.isConnected).toBe(false)
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:affiliate-export'))
  })
})
