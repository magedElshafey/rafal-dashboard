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
  it('clears the selected page and submits all six fields with explicit null', async () => {
    const save = vi.fn().mockResolvedValue({ ...initial, termsPageId: null })
    form(save)
    await userEvent.click(screen.getByRole('button', { name: i18n.t('label.clear_selection') }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...initial, termsPageId: null }))
    expect(save).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })
  it('keeps an initial null page when saving another field even if page lookup fails', async () => {
    vi.mocked(staticPagesService.list).mockRejectedValue(new Error('Unavailable'))
    const settings = { ...initial, termsPageId: null }
    const save = vi.fn().mockResolvedValue({ ...settings, customerDiscountPercentage: 12 })
    render(wrap(<AffiliateSettingsForm settings={settings} isSubmitting={false} canWrite onSubmit={save} />))
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...settings, customerDiscountPercentage: 12 }))
  })
  it('uses verified selected-page metadata even when the options page is unavailable', async () => {
    vi.mocked(staticPagesService.list).mockRejectedValue(new Error('Unavailable'))
    const settings = { ...initial, termsPage: { id: 2, title: 'Selected terms', isPublished: true } }
    const save = vi.fn().mockResolvedValue({ ...settings, customerDiscountPercentage: 12 })
    render(wrap(<AffiliateSettingsForm settings={settings} isSubmitting={false} canWrite onSubmit={save} />))
    const user = userEvent.setup()
    const discount = screen.getByRole('spinbutton', { name: 'Customer discount percentage' })
    await user.clear(discount)
    await user.type(discount, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ ...initial, customerDiscountPercentage: 12 }))
  })
  it('maps a null-page 422 to the selector and preserves the cleared draft', async () => {
    const save = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { errors: { terms_page_id: ['Page cannot be null'] } } },
    })
    form(save)
    await userEvent.click(screen.getByRole('button', { name: i18n.t('label.clear_selection') }))
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Page cannot be null')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith({ ...initial, termsPageId: null })
    expect(screen.queryByRole('button', { name: i18n.t('label.clear_selection') })).not.toBeInTheDocument()
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
