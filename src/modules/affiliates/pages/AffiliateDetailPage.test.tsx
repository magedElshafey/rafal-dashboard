import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import AffiliateDetailPage from '@/modules/affiliates/pages/AffiliateDetailPage'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { Affiliate, AffiliateAuditEvent } from '@/modules/affiliates/types/affiliate.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

Element.prototype.scrollIntoView = vi.fn()

let affiliate: Affiliate
let activity: AffiliateAuditEvent[]

const baseAffiliate: Affiliate = {
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

function installFixtures() {
  vi.spyOn(affiliatesService, 'show').mockImplementation(async () => ({ ...affiliate }))
  vi.spyOn(affiliatesService, 'activity').mockImplementation(async () => [...activity])
  vi.spyOn(affiliatesService, 'update').mockImplementation(async (_id, payload) => {
    affiliate = { ...affiliate, ...payload, updatedAt: '2026-11-21T10:00:00.000Z' }
    return { ...affiliate }
  })
  vi.spyOn(affiliatesService, 'suspend').mockImplementation(async () => {
    affiliate = { ...affiliate, status: 'suspended' }
    return { ...affiliate }
  })
  vi.spyOn(affiliatesService, 'reactivate').mockImplementation(async () => {
    affiliate = { ...affiliate, status: 'active' }
    return { ...affiliate }
  })
  vi.spyOn(affiliatesService, 'resetPassword').mockResolvedValue({
    affiliateId: 101,
    deliveryStatus: 'queued',
    channel: 'sms',
    requiresPasswordChange: true,
    requestedAt: '2026-11-21T10:00:00.000Z',
  })
}

function renderPage(path = '/dashboard/affiliates/101') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/affiliates/:id" element={<AffiliateDetailPage />} />
          <Route path="/dashboard/affiliates" element={<div>Affiliate list destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { client }
}

async function openEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Edit' }))
  return screen.findByRole('dialog')
}

describe('Affiliate detail page', () => {
  beforeEach(async () => {
    affiliate = { ...baseAffiliate }
    activity = []
    installFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the authoritative profile, contextual actions, and safe chronological activity', async () => {
    activity = [
      {
        id: '8bd918c9-1ad2-4d7a-8547-daec5d2f488f',
        affiliateId: 101,
        action: 'profile_updated',
        actor: { type: 'mock_staff', id: 'development-staff' },
        previousState: { name: 'Noura' },
        newState: { name: 'Noura Al Harbi' },
        createdAt: '2026-11-11T09:00:00.000Z',
      },
      {
        id: '6f6ec4e7-cb41-48bf-ae65-f04a5a623bbc',
        affiliateId: 101,
        action: 'password_reset_requested',
        actor: { type: 'mock_staff', id: 'development-staff' },
        previousState: null,
        newState: null,
        createdAt: '2026-11-12T09:00:00.000Z',
      },
    ]
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Noura Al Harbi' })).toBeInTheDocument()
    expect(screen.getAllByText('NOURA25').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Suspend Affiliate' })).toBeInTheDocument()
    expect(await screen.findByText('Profile updated')).toBeInTheDocument()
    expect(screen.getByText('Password reset requested')).toBeInTheDocument()
    expect(screen.getAllByText('Development staff')).toHaveLength(2)
    expect(screen.queryByText('development-staff')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('{"')
  })

  it('handles loading failure retry, invalid IDs, and API 404', async () => {
    const show = vi.mocked(affiliatesService.show)
    show.mockRejectedValueOnce(new Error('private network detail'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private network detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: 'Noura Al Harbi' })).toBeInTheDocument()

    renderPage('/dashboard/affiliates/not-an-id')
    expect(await screen.findByText('Affiliate not found')).toBeInTheDocument()

    show.mockRejectedValue(
      Object.assign(new Error('not found'), { isAxiosError: true, response: { status: 404, data: {} } })
    )
    renderPage('/dashboard/affiliates/999')
    expect((await screen.findAllByText('Affiliate not found')).length).toBeGreaterThan(0)
  })

  it('prefills editable fields, validates locally, and PATCHes only changed profile fields', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openEdit(user)
    expect(within(dialog).getByRole('textbox', { name: 'Full name' })).toHaveValue('Noura Al Harbi')
    expect(within(dialog).getByText('NOURA25')).toBeInTheDocument()
    expect(within(dialog).getByText('Active')).toBeInTheDocument()
    expect(within(dialog).queryByRole('textbox', { name: 'Affiliate code' })).not.toBeInTheDocument()

    const mobile = within(dialog).getByRole('textbox', { name: 'Saudi mobile number' })
    await user.clear(mobile)
    await user.type(mobile, '123')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(dialog).findByText('Enter a valid Saudi mobile number.')).toBeInTheDocument()
    expect(affiliatesService.update).not.toHaveBeenCalled()

    await user.clear(mobile)
    await user.type(mobile, '+966501112233')
    const name = within(dialog).getByRole('textbox', { name: 'Full name' })
    await user.clear(name)
    await user.type(name, 'Noura Updated')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(affiliatesService.update).toHaveBeenCalledWith(101, { name: 'Noura Updated' })
    expect(await screen.findByRole('heading', { name: 'Noura Updated' })).toBeInTheDocument()
  })

  it('maps duplicate-email errors and preserves unsaved form values', async () => {
    const validation = Object.assign(new Error('unsafe validation'), {
      isAxiosError: true,
      response: { status: 422, data: { errors: { mobile: ['invalid'] } } },
    })
    const conflict = Object.assign(new Error('unsafe duplicate'), {
      isAxiosError: true,
      response: { status: 409, data: { code: 'AFFILIATE_EMAIL_CONFLICT', errors: { email: ['duplicate'] } } },
    })
    vi.mocked(affiliatesService.update).mockRejectedValueOnce(validation).mockRejectedValueOnce(conflict)
    const user = userEvent.setup()
    renderPage()
    const dialog = await openEdit(user)
    const mobile = within(dialog).getByRole('textbox', { name: 'Saudi mobile number' })
    await user.clear(mobile)
    await user.type(mobile, '0551112233')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(dialog).findByText('Review this field and try again.')).toBeInTheDocument()
    expect(mobile).toHaveValue('0551112233')

    const email = within(dialog).getByRole('textbox', { name: 'Email address' })
    await user.clear(email)
    await user.type(email, 'kept@example.test')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await within(dialog).findByText('Review this field and try again.')).toBeInTheDocument()
    expect(email).toHaveValue('kept@example.test')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(dialog).toBeInTheDocument()
  })

  it('discards abandoned edits and reopens with authoritative pristine values', async () => {
    const user = userEvent.setup()
    renderPage()
    const dialog = await openEdit(user)
    const save = within(dialog).getByRole('button', { name: 'Save changes' })
    const name = within(dialog).getByRole('textbox', { name: 'Full name' })
    expect(save).toBeDisabled()

    await user.clear(name)
    await user.type(name, 'Abandoned edit')
    expect(save).toBeEnabled()
    await user.click(within(dialog).getByRole('button', { name: 'Close edit affiliate drawer' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const reopened = await openEdit(user)
    expect(within(reopened).getByRole('textbox', { name: 'Full name' })).toHaveValue('Noura Al Harbi')
    expect(within(reopened).getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('preserves unsaved values through a background refresh without PATCHing untouched stale fields', async () => {
    const user = userEvent.setup()
    const { client } = renderPage()
    const dialog = await openEdit(user)
    const username = within(dialog).getByRole('textbox', { name: 'Platform username' })
    await user.clear(username)
    await user.type(username, 'noura.draft')

    affiliate = { ...affiliate, name: 'Authoritative Refresh' }
    client.setQueryData(affiliatesKeys.detail(101), { ...affiliate })
    await waitFor(() => expect(screen.getAllByText('Authoritative Refresh').length).toBeGreaterThan(0))
    expect(within(dialog).getByRole('textbox', { name: 'Full name' })).toHaveValue('Noura Al Harbi')
    expect(username).toHaveValue('noura.draft')

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(affiliatesService.update).toHaveBeenCalledWith(101, { username: 'noura.draft' })
  })

  it('confirms suspension, prevents duplicate actions, and switches to reactivation', async () => {
    let resolveSuspend!: (value: Affiliate) => void
    const suspend = vi
      .mocked(affiliatesService.suspend)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSuspend = resolve)))
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Suspend Affiliate' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/Affiliate Panel login is not prevented/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(suspend).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Suspend Affiliate' }))
    const reopenedDialog = await screen.findByRole('alertdialog')
    const confirm = within(reopenedDialog).getByRole('button', { name: 'Suspend Affiliate' })
    await user.dblClick(confirm)
    expect(suspend).toHaveBeenCalledTimes(1)
    affiliate = { ...affiliate, status: 'suspended' }
    resolveSuspend({ ...affiliate })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('button', { name: 'Reactivate Affiliate' })).toBeInTheDocument()
  })

  it('reconciles a stale status after a 409 and supports reactivation', async () => {
    const conflict = Object.assign(new Error('already changed'), {
      isAxiosError: true,
      response: { status: 409, data: { code: 'AFFILIATE_STATUS_CONFLICT', errors: { status: ['changed'] } } },
    })
    vi.mocked(affiliatesService.suspend).mockRejectedValueOnce(conflict)
    vi.mocked(affiliatesService.show)
      .mockResolvedValueOnce({ ...affiliate })
      .mockImplementation(async () => ({ ...affiliate, status: 'suspended' }))
    const user = userEvent.setup()
    const { client } = renderPage()
    client.setQueryData(affiliatesKeys.list(), { pages: [], pageParams: [] })
    await user.click(await screen.findByRole('button', { name: 'Suspend Affiliate' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Suspend Affiliate' }))
    expect(await screen.findByRole('button', { name: 'Reactivate Affiliate' })).toBeInTheDocument()
    expect(toastMocks.error).toHaveBeenCalledWith(
      'The Affiliate status already changed. The current details have been refreshed.'
    )
    expect(client.getQueryState(affiliatesKeys.list())?.isInvalidated).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Reactivate Affiliate' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Reactivate Affiliate' })
    )
    expect(affiliatesService.reactivate).toHaveBeenCalledWith(101)
  })

  it('queues password reset safely and refreshes activity without exposing credentials', async () => {
    const activityApi = vi.mocked(affiliatesService.activity)
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Noura Al Harbi' })
    await waitFor(() => expect(activityApi).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(/queue an SMS credential-reset request/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(affiliatesService.resetPassword).toHaveBeenCalledWith(101)
    expect(toastMocks.success).toHaveBeenCalledWith('Password reset initiated. SMS delivery has been queued.')
    await waitFor(() => expect(activityApi.mock.calls.length).toBeGreaterThan(1))
    expect(document.body.textContent).not.toMatch(/password\s*[:=]|credential\s*[:=]/i)
  })

  it('keeps activity errors independent and supports an empty history retry', async () => {
    vi.mocked(affiliatesService.activity).mockRejectedValueOnce(new Error('private activity failure'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Noura Al Harbi' })).toBeInTheDocument()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private activity failure')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No management activity')).toBeInTheDocument()
  })

  it('localizes the management surface in Arabic and preserves LTR values', async () => {
    await i18n.changeLanguage('ar')
    renderPage()
    expect(await screen.findByRole('button', { name: 'إيقاف المسوق' })).toBeInTheDocument()
    expect(screen.getByText('المعلومات الشخصية')).toBeInTheDocument()
    expect(screen.getAllByText('NOURA25')[0]).toHaveAttribute('dir', 'ltr')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })
})
