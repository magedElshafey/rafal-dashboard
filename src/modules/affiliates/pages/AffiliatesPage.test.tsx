import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import AffiliatesPage from '@/modules/affiliates/pages/AffiliatesPage'
import type { Affiliate } from '@/modules/affiliates/types/affiliate.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
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
    items,
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
  vi.spyOn(affiliatesService, 'suggestCode').mockResolvedValue({ code: 'RAF12AB34CD56', reserved: false })
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
    return affiliate
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

  it('renders loading, one responsive data source, localized statuses, and all required fields', async () => {
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()

    expect(await screen.findAllByText('Noura Al Harbi')).toHaveLength(2)
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getAllByText('Suspended')).toHaveLength(2)
    expect(screen.getAllByText('+966501112233')).toHaveLength(2)
    expect(screen.getAllByText('noura.styles')).toHaveLength(2)
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

  it('prefills a suggestion without overwriting a manually edited code', async () => {
    let resolveSuggestion!: (value: { code: string; reserved: false }) => void
    vi.spyOn(affiliatesService, 'suggestCode').mockImplementation(
      () => new Promise((resolve) => (resolveSuggestion = resolve))
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Noura Al Harbi')
    const dialog = await openCreateDrawer(user)
    const code = within(dialog).getByRole('textbox', { name: 'Affiliate code' })
    await user.type(code, 'mine42')
    expect(code).toHaveValue('MINE42')

    resolveSuggestion({ code: 'RAF12AB34CD56', reserved: false })
    await waitFor(() => expect(code).toHaveValue('MINE42'))
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
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('RAF12AB34CD56')
    )
    await fillCreateForm(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: 'Create Affiliate' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith({
      name: 'Sara Al Salem',
      mobile: '0551234567',
      email: 'sara@example.test',
      platform: 'instagram',
      username: 'sara.style',
      code: 'RAF12AB34CD56',
    })
    expect(await screen.findAllByText('Sara Al Salem')).toHaveLength(2)
    expect(JSON.stringify(client.getQueriesData({ queryKey: ['affiliates'] }))).not.toMatch(/password|credential/i)
    expect(toastMocks.success).toHaveBeenCalledWith(
      'Affiliate created successfully. Credential delivery has been initiated by the backend.'
    )
  })

  it('maps 409 code errors, preserves values, and prevents repeated submissions', async () => {
    const conflict = Object.assign(new Error('unsafe conflict detail'), {
      isAxiosError: true,
      response: {
        status: 409,
        data: { code: 'COUPON_CODE_CONFLICT', errors: { code: ['The code conflicts with a coupon.'] } },
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

    expect(await within(dialog).findByText('Review this field and try again.')).toBeInTheDocument()
    expect(create).toHaveBeenCalledTimes(1)
    expect(within(dialog).getByRole('textbox', { name: 'Full name' })).toHaveValue('  Sara  Al Salem  ')
    expect(within(dialog).getByRole('textbox', { name: 'Affiliate code' })).toHaveValue('RAF12AB34CD56')
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
