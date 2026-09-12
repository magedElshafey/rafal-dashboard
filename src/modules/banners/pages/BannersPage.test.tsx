import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { bannersService } from '@/modules/banners/api/banners.service'
import { resetBannersMock, seedBannersMock } from '@/modules/banners/mocks/banners.mock'
import BannersPage from '@/modules/banners/pages/BannersPage'
import type { Banner } from '@/modules/banners/types/banner.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

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

const banner = (id: number, title = `Banner ${id}`): Banner => ({
  id,
  placement: 'home',
  title: { ar: `لافتة ${id}`, en: title },
  link_url: null,
  platform: 'both',
  starts_at: null,
  ends_at: null,
  is_active: true,
  sort_order: id,
  image_url: `https://example.test/banner-${id}.jpg`,
  created_at: '2026-09-06T20:01:03+00:00',
  updated_at: '2026-09-06T20:01:03+00:00',
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <BannersPage />
      </QueryClientProvider>
    ),
  }
}

async function openAction(user: ReturnType<typeof userEvent.setup>, title: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${title}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${title}` }))
}

async function fillRequiredCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /^Arabic Title/ }), 'عنوان جديد')
  await user.type(screen.getByRole('textbox', { name: /^English Title/ }), 'New banner')
  await user.upload(screen.getByLabelText('Browse images'), new File(['image'], 'banner.png', { type: 'image/png' }))
}

describe('BannersPage', () => {
  beforeEach(async () => {
    resetBannersMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:banner-preview')
    URL.revokeObjectURL = vi.fn()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders mirrored responsive data, localized titles, infinite pagination, and no search or filters', async () => {
    seedBannersMock(Array.from({ length: 16 }, (_, index) => banner(index + 1)))
    const list = vi.spyOn(bannersService, 'list')
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8)
    expect(await screen.findAllByText('Banner 16')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument()
  })

  it('uses the shared empty and safe retry states', async () => {
    seedBannersMock([])
    const originalList = bannersService.list
    const list = vi.spyOn(bannersService, 'list').mockRejectedValueOnce(new Error('unsafe details'))
    list.mockImplementation(originalList)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe details')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No banners yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Banner' })).toHaveLength(2)
  })

  it('validates localized titles, sort order, image, and schedule ordering', async () => {
    const create = vi.spyOn(bannersService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('New collection arrived')
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))
    await user.clear(screen.getByRole('spinbutton', { name: /^Sort Order/ }))
    await user.type(screen.getByRole('spinbutton', { name: /^Sort Order/ }), '-1')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Arabic title is required.')).toBeInTheDocument()
    expect(screen.getByText('English title is required.')).toBeInTheDocument()
    expect(screen.getByText('Sort order cannot be negative.')).toBeInTheDocument()
    expect(screen.getByText(/An image is required/)).toBeInTheDocument()

    await fillRequiredCreate(user)
    await user.type(screen.getByLabelText('Start Date/Time'), '2026-10-20T10:00')
    await user.type(screen.getByLabelText('End Date/Time'), '2026-10-19T10:00')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('End date cannot be earlier than start date.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates with selected placement/platform, optional link/schedule, normalized order, and image', async () => {
    const create = vi.spyOn(bannersService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('New collection arrived')
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))
    await fillRequiredCreate(user)
    await user.click(screen.getByRole('combobox', { name: /^Placement/ }))
    await user.click(screen.getByRole('option', { name: 'Splash' }))
    await user.click(screen.getByRole('combobox', { name: /^Platform/ }))
    await user.click(screen.getByRole('option', { name: 'Web' }))
    await user.type(screen.getByRole('textbox', { name: 'Link URL' }), '/products/example')
    const order = screen.getByRole('spinbutton', { name: /^Sort Order/ })
    await user.clear(order)
    await user.type(order, '3')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: { ar: 'عنوان جديد', en: 'New banner' },
        placement: 'splash',
        platform: 'web',
        link_url: '/products/example',
        sort_order: 3,
        image: expect.objectContaining({ name: 'banner.png' }),
      })
    )
    expect(await screen.findAllByText('New banner')).toHaveLength(2)
  })

  it('create another resets fields and image preview while revoking its object URL', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('New collection arrived')
    await user.click(screen.getByRole('button', { name: 'Create Banner' }))
    await fillRequiredCreate(user)
    await screen.findByRole('img', { name: 'banner.png' })
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))

    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Arabic Title/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /^English Title/ })).toHaveValue('')
    expect(screen.queryByRole('img', { name: 'banner.png' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:banner-preview'))
  })

  it('loads show data, renders the remote image, and blocks pristine edits', async () => {
    const show = vi.spyOn(bannersService, 'show')
    const update = vi.spyOn(bannersService, 'update')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'New collection arrived', 'Edit')
    expect(screen.getByRole('dialog').querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: /^English Title/ })).toHaveValue('New collection arrived')
    expect(show).toHaveBeenCalledWith(42, expect.any(AbortSignal))
    expect(screen.getByRole('img', { name: 'New collection arrived' })).toHaveAttribute(
      'src',
      expect.stringMatching(/^https:/)
    )
    expect(screen.getByRole('combobox', { name: /^Placement/ })).toHaveTextContent('Home')
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })

  it('enables edit for fields and replacement images without resubmitting unchanged remote URLs', async () => {
    const update = vi.spyOn(bannersService, 'update')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'New collection arrived', 'Edit')
    const englishTitle = await screen.findByRole('textbox', { name: /^English Title/ })
    await user.clear(englishTitle)
    await user.type(englishTitle, 'Updated banner')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update).toHaveBeenCalledWith(42, expect.not.objectContaining({ image: expect.anything() }))

    await openAction(user, 'Updated banner', 'Edit')
    await screen.findByRole('img', { name: 'Updated banner' })
    await user.upload(
      screen.getByLabelText('Browse images'),
      new File(['replacement'], 'replacement.png', { type: 'image/png' })
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    expect(update.mock.calls[1][1].image).toMatchObject({ name: 'replacement.png' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('requires a replacement when the existing image is removed', async () => {
    const update = vi.spyOn(bannersService, 'update')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'New collection arrived', 'Edit')
    await screen.findByRole('img', { name: 'New collection arrived' })
    await user.click(screen.getByRole('button', { name: 'Remove New collection arrived' }))
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(await screen.findByText(/An image is required/)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it('shows a safe detail retry state', async () => {
    const originalShow = bannersService.show
    const show = vi.spyOn(bannersService, 'show').mockRejectedValueOnce(new Error('unsafe detail'))
    show.mockImplementation(originalShow)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'New collection arrived', 'Edit')
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(within(dialog).queryByText('unsafe detail')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /try again/i }))
    expect(await within(dialog).findByRole('textbox', { name: /^English Title/ })).toHaveValue('New collection arrived')
  })

  it('requires delete confirmation and removes the banner', async () => {
    seedBannersMock([banner(8, 'Disposable banner')])
    const remove = vi.spyOn(bannersService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Disposable banner', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Disposable banner')).not.toBeInTheDocument()
  })

  it('uses Arabic titles and keeps directional form controls usable in RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findAllByText('مجموعة جديدة وصلت')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'إنشاء لافتة' }))
    expect(screen.getByRole('textbox', { name: /^العنوان بالعربية/ })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('textbox', { name: /^العنوان بالإنجليزية/ })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('spinbutton', { name: /^ترتيب العرض/ })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('group', { name: 'الصورة' })).toBeInTheDocument()
  })
})
