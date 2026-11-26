import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import AffiliatesPage from '@/modules/affiliates/pages/AffiliatesPage'
import { affiliatesKeys } from '../queries/affiliates.keys'
import type { Affiliate, AffiliateListItem } from '@/modules/affiliates/types/affiliate.types'

vi.mock('@/modules/affiliates/config/affiliate-feature', () => ({ isAffiliateFeatureEnabled: true }))

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()

const activeAffiliate: Affiliate = {
  id: 101,
  name: 'Noura Al Harbi',
  mobile: '+966501112233',
  email: 'noura@example.test',
  platform: 'instagram',
  username: 'noura.styles',
  code: 'NOURA25',
  status: 'active',
  createdAt: '2026-11-10T09:30:00.000Z',
  updatedAt: '2026-11-10T09:30:00.000Z',
}

const suspendedAffiliate: Affiliate = {
  ...activeAffiliate,
  id: 102,
  name: 'Reem Al Saud',
  mobile: '+966502224455',
  email: 'reem@example.test',
  username: 'reem.daily',
  code: 'REEM77',
  status: 'suspended',
}

let affiliates: Affiliate[] = []

function page(items: Affiliate[], currentPage = 1) {
  return {
    items: items.map(
      (item) =>
        ({
          ...item,
          source: 'staff',
          ordersCount: 0,
          pending: '0.00',
          approvedUnpaid: '0.00',
          paid: '0.00',
        }) satisfies AffiliateListItem
    ),
    paginate: {
      current_page: currentPage,
      total_pages: 1,
      per_page: 15,
      total: items.length,
      count: items.length,
      next_page_url: null,
      prev_page_url: null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(affiliatesService, 'list').mockImplementation(async (_page, _signal, filters) => {
    const search = filters?.search.toLowerCase() ?? ''
    return page(
      affiliates.filter(
        (affiliate) =>
          (!filters?.status || affiliate.status === filters.status) &&
          (!search ||
            [affiliate.name, affiliate.email, affiliate.mobile, affiliate.code].some((value) =>
              value.toLowerCase().includes(search)
            ))
      )
    )
  })
  vi.spyOn(affiliatesService, 'create').mockImplementation(async (payload) => {
    const affiliate: Affiliate = {
      id: 200,
      ...payload,
      mobile: '+966551234567',
      status: 'active',
      createdAt: '2026-11-21T10:00:00.000Z',
      updatedAt: '2026-11-21T10:00:00.000Z',
    }
    affiliates.unshift(affiliate)
    return { affiliate: { id: affiliate.id }, sms_sent: true, sms_message: null }
  })
}

function renderPage(path = '/dashboard/affiliates') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    client,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <QueryClientProvider client={client}>
          <AffiliatesPage />
        </QueryClientProvider>
      </MemoryRouter>
    ),
  }
}

async function openCreateDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Create Affiliate' }))
  return screen.findByRole('dialog')
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.type(within(dialog).getByRole('textbox', { name: 'Full name' }), '  Sara  Al Salem  ')
  await user.type(within(dialog).getByRole('textbox', { name: 'Saudi mobile number' }), '0551234567')
  await user.type(within(dialog).getByRole('textbox', { name: 'Email address' }), 'SARA@EXAMPLE.TEST')
  await user.type(within(dialog).getByRole('textbox', { name: 'Social platform' }), 'Instagram')
  await user.type(within(dialog).getByRole('textbox', { name: 'Platform username' }), 'sara.style')
}

describe('Affiliates page', () => {
  beforeEach(async () => {
    affiliates = [activeAffiliate, suspendedAffiliate]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders exact server summary values, latest page metadata, and filtered response changes without summing rows', async () => {
    const totals = {
      pending: '45.00',
      approved_unpaid: '12345678901234567890.01',
      paid_this_month: '400.00',
      open_requests: { count: 2, amount: '350.00' },
    }
    vi.mocked(affiliatesService.list).mockImplementation(async (_page, _signal, filters) => ({
      ...page([]),
      extra: { ...totals, pending: filters?.search ? '99.00' : '45.00' },
    }))
    const { client } = renderPage()
    expect(await screen.findByText('45.00 SAR')).toBeInTheDocument()
    expect(screen.getByText('12345678901234567890.01 SAR')).toBeInTheDocument()
    expect(screen.getByText('2 requests · 350.00 SAR')).toBeInTheDocument()
    client.setQueryData(affiliatesKeys.list(), {
      pages: [
        { ...page([]), extra: totals },
        { ...page([], 2), extra: { ...totals, pending: '46.00' } },
      ],
      pageParams: [1, 2],
    })
    expect(await screen.findByText('46.00 SAR')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: 'Search affiliates' }), 'Noura')
    expect(await screen.findByText('99.00 SAR')).toBeInTheDocument()
    expect(screen.queryByText('46.00 SAR')).not.toBeInTheDocument()
  })
  it('shows unavailable summaries rather than invented zero balances', async () => {
    affiliates = []
    renderPage()
    expect(await screen.findAllByText('Unavailable')).toHaveLength(4)
    expect(screen.queryByText('0.00 SAR')).not.toBeInTheDocument()
  })

  it('renders loading, one responsive data source, localized statuses, and all required fields', async () => {
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()

    expect(await screen.findAllByText('Noura Al Harbi')).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Noura Al Harbi' })[0]).toHaveAttribute(
      'href',
      '/dashboard/affiliates/101'
    )
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getAllByText('Suspended')).toHaveLength(2)
    expect(screen.getAllByText('+966501112233')).toHaveLength(2)
    expect(screen.getAllByText('staff')).toHaveLength(4)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()
  })

  it('shows distinct unfiltered and filtered empty states', async () => {
    affiliates = []
    const { unmount } = renderPage()
    expect(await screen.findByText('No affiliates yet')).toBeInTheDocument()
    unmount()

    renderPage('/dashboard/affiliates?search=missing&status=active')
    expect(await screen.findByText('No matching affiliates')).toBeInTheDocument()
  })

  it('shows a safe initial error and retries the Affiliate query', async () => {
    const list = vi.mocked(affiliatesService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValue(new Error('private mock internals'))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private mock internals')).not.toBeInTheDocument()
    list.mockImplementation(implementation!)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findAllByText('Noura Al Harbi')).toHaveLength(2)
  })

  it('preserves a manually entered code without calling an undocumented generator', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Noura Al Harbi')
    const dialog = await openCreateDrawer(user)
    const code = within(dialog).getByRole('textbox', { name: 'Affiliate code' })
    await user.type(code, 'mine42')
    expect(code).toHaveValue('MINE42')
  })

  it('validates required fields, Saudi mobile, email, and code before submission', async () => {
    const create = vi.mocked(affiliatesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Noura Al Harbi')
    const dialog = await openCreateDrawer(user)
    await user.click(within(dialog).getByRole('button', { name: 'Create Affiliate' }))
    expect(await within(dialog).findAllByText('This field is required.')).toHaveLength(5)

    await user.type(within(dialog).getByRole('textbox', { name: 'Full name' }), 'Sara')
    await user.type(within(dialog).getByRole('textbox', { name: 'Saudi mobile number' }), '123')
    await user.type(within(dialog).getByRole('textbox', { name: 'Email address' }), 'invalid')
    await user.type(within(dialog).getByRole('textbox', { name: 'Social platform' }), 'instagram')
    await user.type(within(dialog).getByRole('textbox', { name: 'Platform username' }), 'sara')
    const code = within(dialog).getByRole('textbox', { name: 'Affiliate code' })
    await user.clear(code)
    await user.type(code, 'A!')
    await user.click(within(dialog).getByRole('button', { name: 'Create Affiliate' }))

    expect(await within(dialog).findByText('Enter a valid Saudi mobile number.')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(within(dialog).getByText('Use 4–20 uppercase English letters or numbers only.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates, closes, invalidates the list, and renders the authoritative Affiliate without credentials', async () => {
    const create = vi.mocked(affiliatesService.create)
    const user = userEvent.setup()
    const { client } = renderPage()
    await screen.findAllByText('Noura Al Harbi')
    const dialog = await openCreateDrawer(user)
    await fillCreateForm(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Create Affiliate' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith({
      name: 'Sara Al Salem',
      mobile: '0551234567',
      email: 'sara@example.test',
      platform: 'instagram',
      username: 'sara.style',
      code: '',
    })
    expect(await screen.findAllByText('Sara Al Salem')).toHaveLength(2)
    expect(JSON.stringify(client.getQueriesData({ queryKey: ['affiliates'] }))).not.toMatch(/password|credential/i)
    expect(toastMocks.success).toHaveBeenCalledWith('Affiliate account created.')
  })

  it('maps 422 code errors, preserves values, and prevents repeated submissions', async () => {
    const conflict = Object.assign(new Error('unsafe conflict detail'), {
      isAxiosError: true,
      response: {
        status: 422,
        data: { errors: { code: ['The code conflicts with a coupon.'] } },
      },
    })
    let rejectCreate!: (reason: unknown) => void
    const create = vi
      .spyOn(affiliatesService, 'create')
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectCreate = reject)))
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Noura Al Harbi')
    const dialog = await openCreateDrawer(user)
    await fillCreateForm(user, dialog)
    await user.dblClick(within(dialog).getByRole('button', { name: 'Create Affiliate' }))
    expect(create).toHaveBeenCalledTimes(1)
    rejectCreate(conflict)

    expect(await within(dialog).findByText('The code conflicts with a coupon.')).toBeInTheDocument()
    expect(create).toHaveBeenCalledTimes(1)
    expect(within(dialog).getByRole('textbox', { name: 'Full name' })).toHaveValue('  Sara  Al Salem  ')
    expect(within(dialog).getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('')
    expect(dialog).toBeInTheDocument()
  })

  it('keeps Arabic labels and RTL document direction usable', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'المسوقون بالعمولة' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'إنشاء مسوق' }))
    expect(await screen.findByRole('textbox', { name: 'البريد الإلكتروني' })).toHaveAttribute('dir', 'ltr')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })
})
