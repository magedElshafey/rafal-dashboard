import { useAuth } from '@/store/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { affiliatesService } from '../api/affiliates.service'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { AffiliateSettingsForm } from '../components/AffiliateSettingsForm'
import AffiliateSettingsPage from './AffiliateSettingsPage'
import type { AffiliateSettings } from '../types/affiliate.types'
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
vi.mock('../config/affiliate-feature', () => ({
  isAffiliateFeatureEnabled: true,
  isAffiliateSettingsWriteReady: false,
}))
const initial: AffiliateSettings = {
  programEnabled: true,
  applicationsEnabled: true,
  customerDiscountPercentage: 10,
  affiliateCommissionPercentage: 5,
  minimumPayoutAmount: '100.00',
  termsPageId: 2,
}
function wrap(element: React.ReactNode) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
    >
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>
  )
}
function form(onSubmit = vi.fn().mockResolvedValue(initial), canWrite = true) {
  return render(
    wrap(<AffiliateSettingsForm settings={initial} isSubmitting={false} canWrite={canWrite} onSubmit={onSubmit} />)
  )
}
beforeEach(async () => {
  useAuth.setState({
    isAuthenticated: true,
    token: 'synthetic-staff-token',
    effectivePermissions: [
      'affiliates.view',
      'affiliates.manage',
      'affiliates.settings.manage',
      'affiliates.payouts.process',
    ],
  })
  await i18n.changeLanguage('en')
  vi.spyOn(affiliatesService, 'getSettings').mockResolvedValue(initial)
  vi.spyOn(staticPagesService, 'list').mockResolvedValue({
    items: [
      {
        id: 2,
        slug: 'terms',
        title: { en: 'Terms', ar: 'الشروط' },
        content: { en: null, ar: null },
        isPublished: true,
        isSystem: false,
        createdAt: '',
        updatedAt: '',
      },
    ],
    paginate: {
      current_page: 1,
      total_pages: 1,
      per_page: 25,
      total: 0,
      count: 0,
      next_page_url: null,
      prev_page_url: null,
    },
    extra: null,
  })
})
afterEach(() => vi.restoreAllMocks())
describe('Laravel settings UI', () => {
  it('renders read-only settings without save or page-option requests until contract/access is ready', async () => {
    render(wrap(<AffiliateSettingsPage />))
    expect(await screen.findByRole('switch', { name: 'Programme enabled' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
    expect(staticPagesService.list).not.toHaveBeenCalled()
    expect(screen.queryByText(/Mock API/)).not.toBeInTheDocument()
  })
  it('reuses initial error and retry', async () => {
    vi.mocked(affiliatesService.getSettings).mockRejectedValueOnce(new Error('private'))
    render(wrap(<AffiliateSettingsPage />))
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('switch', { name: 'Programme enabled' })).toBeInTheDocument()
    expect(screen.queryByText('private')).not.toBeInTheDocument()
  })
  it('validates documented ranges before submission', async () => {
    const save = vi.fn()
    form(save)
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '0')
    expect(await screen.findByText(/Discount must be/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(save).not.toHaveBeenCalled()
  })
  it('sends all six fields and no version for a single changed field', async () => {
    const save = vi.fn().mockResolvedValue({ ...initial, customerDiscountPercentage: 12 })
    form(save)
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...initial, customerDiscountPercentage: 12 }))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })
  it('preserves draft on a 422 and renders backend text safely', async () => {
    const text = '<img src=x onerror=alert(1)> collision'
    const save = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { errors: { customer_discount_percent: [text] } } },
    })
    form(save)
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
    expect(discount).toHaveValue(12)
  })
  it('requires a terms page and offers no clear action', () => {
    form()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true')
    expect(screen.queryByRole('button', { name: i18n.t('label.clear_selection') })).not.toBeInTheDocument()
  })
  it.each([false, true])(
    'renders initial null without a default and blocks changes when options fail=%s',
    async (lookupFails) => {
      if (lookupFails) vi.mocked(staticPagesService.list).mockRejectedValue(new Error('Unavailable'))
      const settings = { ...initial, termsPageId: null }
      const save = vi.fn()
      render(wrap(<AffiliateSettingsForm settings={settings} isSubmitting={false} canWrite onSubmit={save} />))
      expect(screen.getByRole('combobox')).toHaveTextContent(/^$/)
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
      const user = userEvent.setup()
      const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
      await user.clear(discount)
      await user.type(discount, '12')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
      expect(save).not.toHaveBeenCalled()
      expect(discount).toHaveValue(12)
      expect(screen.getByRole('combobox')).toHaveTextContent(/^$/)
    }
  )
  it('allows selecting a published page from an initially null form and submits six fields', async () => {
    const listing = await staticPagesService.list(1)
    vi.mocked(staticPagesService.list).mockResolvedValue({
      ...listing,
      items: listing.items.map((page) => ({ ...page, id: 9 })),
    })
    const persisted = {
      ...initial,
      programEnabled: false,
      applicationsEnabled: false,
      affiliateCommissionPercentage: 10,
      termsPageId: 9,
    }
    const save = vi.fn().mockResolvedValue(persisted)
    render(
      wrap(
        <AffiliateSettingsForm
          settings={{ ...persisted, termsPageId: null }}
          isSubmitting={false}
          canWrite
          onSubmit={save}
        />
      )
    )
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Terms' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith(persisted))
    expect(save).toHaveBeenCalledTimes(1)
  })
  it.each([0, -1, 1.5])('blocks invalid selected ID %s', async (termsPageId) => {
    const save = vi.fn()
    render(
      wrap(
        <AffiliateSettingsForm settings={{ ...initial, termsPageId }} isSubmitting={false} canWrite onSubmit={save} />
      )
    )
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await userEvent.clear(discount)
    await userEvent.type(discount, '12')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(save).not.toHaveBeenCalled()
  })
  it('blocks an unpublished loaded page even when baseline metadata says published', async () => {
    const listing = await staticPagesService.list(1)
    vi.mocked(staticPagesService.list).mockResolvedValue({
      ...listing,
      items: listing.items.map((page) => ({ ...page, isPublished: false })),
    })
    const save = vi.fn()
    render(
      wrap(
        <AffiliateSettingsForm
          settings={{ ...initial, termsPage: { id: 2, title: 'Old title', isPublished: true } }}
          isSubmitting={false}
          canWrite
          onSubmit={save}
        />
      )
    )
    await waitFor(() => expect(staticPagesService.list).toHaveBeenCalledTimes(2))
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await userEvent.clear(discount)
    await userEvent.type(discount, '12')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText(i18n.t('affiliates.settings.validation.termsPage'))).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })
  it('uses verified selected-page metadata even when the options page is unavailable', async () => {
    vi.mocked(staticPagesService.list).mockRejectedValue(new Error('Unavailable'))
    const settings = {
      ...initial,
      termsPageId: 9,
      termsPage: { id: 9, title: 'Selected terms', isPublished: true },
    }
    const save = vi.fn().mockResolvedValue({ ...settings, customerDiscountPercentage: 12 })
    render(wrap(<AffiliateSettingsForm settings={settings} isSubmitting={false} canWrite onSubmit={save} />))
    expect(screen.getByRole('combobox')).toHaveTextContent('Selected terms')
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({ ...initial, termsPageId: 9, customerDiscountPercentage: 12 })
    )
  })
  it('maps a terms-page 422 to the selector and preserves the selected page and other draft fields', async () => {
    const save = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { errors: { terms_page_id: ['Choose a published terms page'] } } },
    })
    form(save)
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await userEvent.clear(discount)
    await userEvent.type(discount, '12')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Choose a published terms page')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({ ...initial, customerDiscountPercentage: 12 })
    expect(screen.getByRole('combobox')).toHaveTextContent('Terms')
    expect(discount).toHaveValue(12)
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeEnabled()
  })
  it('requires explicit disable confirmation and cancel sends nothing', async () => {
    const save = vi.fn().mockResolvedValue({ ...initial, programEnabled: false })
    form(save)
    const user = userEvent.setup()
    await user.click(screen.getByRole('switch', { name: 'Programme enabled' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(save).not.toHaveBeenCalled()
  })
  it('preserves dirty values through background refresh and discards to authoritative data', async () => {
    const save = vi.fn()
    const user = userEvent.setup()
    const { rerender } = form(save)
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    rerender(
      wrap(
        <AffiliateSettingsForm
          settings={{ ...initial, customerDiscountPercentage: 20 }}
          isSubmitting={false}
          canWrite
          onSubmit={save}
        />
      )
    )
    expect(discount).toHaveValue(12)
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(discount).toHaveValue(20)
  })
  it('supports Arabic and RTL', async () => {
    await i18n.changeLanguage('ar')
    form(vi.fn(), false)
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getAllByRole('spinbutton')[0]).toHaveAttribute('dir', 'ltr')
  })
})
