import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import '@/config/i18'
import i18n from '@/config/i18'
import { testimonialsService } from '@/modules/testimonials/api/testimonials.service'
import TestimonialsPage from '@/modules/testimonials/pages/TestimonialsPage'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'
import type { Testimonial, TestimonialWritePayload } from '@/modules/testimonials/types/testimonial.types'

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
URL.createObjectURL = vi.fn(() => 'blob:preview')
URL.revokeObjectURL = vi.fn()

const testimonial = (overrides: Partial<Testimonial> = {}): Testimonial => ({
  id: 4,
  name: { ar: 'سارة أحمد', en: 'Sarah Ahmed' },
  title: { ar: 'الرياض', en: 'Riyadh' },
  comment: { ar: 'خدمة ممتازة.', en: 'Excellent service.' },
  rating: 4,
  sortOrder: 0,
  isPublished: true,
  avatarUrl: null,
  createdAt: '2026-09-28T17:40:41+00:00',
  updatedAt: '2026-09-29T17:40:41+00:00',
  ...overrides,
})

const fullPayload = (overrides: Partial<TestimonialWritePayload> = {}): TestimonialWritePayload => ({
  name: { ar: 'سارة أحمد', en: 'Sarah Ahmed' },
  title: { ar: 'الرياض', en: 'Riyadh' },
  comment: { ar: 'خدمة ممتازة.', en: 'Excellent service.' },
  rating: 4,
  sortOrder: 0,
  isPublished: true,
  ...overrides,
})

let testimonials: Testimonial[] = []

function page(items: Testimonial[], currentPage = 1, totalPages = 1) {
  return {
    items,
    paginate: {
      current_page: currentPage,
      total_pages: totalPages,
      per_page: 15,
      total: items.length,
      count: items.length,
      next_page_url: currentPage < totalPages ? String(currentPage + 1) : null,
      prev_page_url: currentPage > 1 ? String(currentPage - 1) : null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(testimonialsService, 'list').mockImplementation(async () => page(testimonials))
  vi.spyOn(testimonialsService, 'create').mockImplementation(async (payload) => {
    const created = testimonial({ id: 5, ...payload, avatarUrl: null })
    testimonials = [created, ...testimonials]
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(testimonialsService, 'update').mockResolvedValue({ success: true, message: 'updated' })
  vi.spyOn(testimonialsService, 'delete').mockImplementation(async (id) => {
    testimonials = testimonials.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage(route = '/dashboard/testimonials') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <TestimonialsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return client
}

async function openAction(user: ReturnType<typeof userEvent.setup>, action: string, name = 'Sarah Ahmed') {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}, testimonial 4` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}, testimonial 4` }))
}

const createPayload: TestimonialWritePayload = {
  name: { ar: 'Nour AR', en: 'Nour Ali' },
  title: { ar: 'Riyadh AR', en: 'Riyadh' },
  comment: { ar: 'Excellent Arabic testimonial', en: 'Excellent English testimonial' },
  rating: 5,
  sortOrder: 0,
  isPublished: false,
}

async function openCreate(user: ReturnType<typeof userEvent.setup>) {
  await screen.findAllByText('Sarah Ahmed')
  await user.click(screen.getByRole('button', { name: 'Create Testimonial' }))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByRole('heading', { name: 'Create Testimonial' })).toBeInTheDocument()
  return dialog
}

async function fillCreateForm(
  user: ReturnType<typeof userEvent.setup>,
  options: { isPublished?: boolean; avatar?: File } = {}
) {
  const values = createPayload
  await user.type(screen.getByRole('textbox', { name: 'Arabic Name' }), values.name.ar)
  await user.type(screen.getByRole('textbox', { name: 'English Name' }), values.name.en)
  await user.type(screen.getByRole('textbox', { name: 'Arabic Title' }), values.title.ar)
  await user.type(screen.getByRole('textbox', { name: 'English Title' }), values.title.en)
  await user.type(screen.getByRole('textbox', { name: 'Arabic Comment' }), values.comment.ar)
  await user.type(screen.getByRole('textbox', { name: 'English Comment' }), values.comment.en)
  await user.type(screen.getByRole('spinbutton', { name: 'Rating' }), String(values.rating))

  const sortOrder = screen.getByRole('spinbutton', { name: 'Sort Order' })
  await user.clear(sortOrder)
  await user.type(sortOrder, String(values.sortOrder))

  const published = screen.getByRole('switch', { name: 'Published' })
  if (published.getAttribute('aria-checked') === 'true' && (options.isPublished ?? values.isPublished) === false) {
    await user.click(published)
  }
  if (published.getAttribute('aria-checked') === 'false' && (options.isPublished ?? values.isPublished) === true) {
    await user.click(published)
  }

  if (options.avatar) await user.upload(screen.getByLabelText('Browse images'), options.avatar)
}

describe('TestimonialsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    testimonials = [testimonial()]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders desktop and mobile data in the current locale with safe avatar, status, zero order, and no unsupported controls', async () => {
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('Sarah Ahmed')).toHaveLength(2)
    expect(screen.getAllByText('Riyadh')).toHaveLength(2)
    expect(screen.getAllByLabelText('No avatar for Sarah Ahmed')).toHaveLength(2)
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByLabelText('Rating: 4')).toHaveLength(2)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()

    await i18n.changeLanguage('ar')
    expect(await screen.findAllByText('سارة أحمد')).toHaveLength(2)
    expect(screen.getAllByText('الرياض')).toHaveLength(2)
  })

  it('shows retryable initial error and localized empty states', async () => {
    testimonials = []
    const list = vi.mocked(testimonialsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe database detail')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No testimonials yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Testimonial' }).length).toBeGreaterThan(0)
  })

  it('creates without an avatar, preserves zero and false, closes, and refetches only the list flow', async () => {
    const list = vi.mocked(testimonialsService.list)
    const create = vi.mocked(testimonialsService.create)
    const user = userEvent.setup()
    renderPage()
    await openCreate(user)
    await fillCreateForm(user, { isPublished: false })

    const submit = screen.getByRole('button', { name: 'Create' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    await waitFor(() => expect(create).toHaveBeenCalledWith(createPayload))
    expect(create.mock.calls[0][0]).not.toHaveProperty('avatar')
    expect(create.mock.calls[0][0]).toMatchObject({ sortOrder: 0, isPublished: false })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1))
    expect(testimonialsService).not.toHaveProperty('show')
  })

  it('creates with the exact local avatar File selected through ImageUploader', async () => {
    const create = vi.mocked(testimonialsService.create)
    const avatar = new File(['avatar bytes'], 'nour-avatar.png', { type: 'image/png' })
    const user = userEvent.setup()
    renderPage()
    await openCreate(user)
    await fillCreateForm(user, { isPublished: false, avatar })

    const submit = screen.getByRole('button', { name: 'Create' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    await waitFor(() => expect(create).toHaveBeenCalledWith({ ...createPayload, avatar }))
    expect(create.mock.calls[0][0].avatar).toBe(avatar)
    expect(create.mock.calls[0][0]).not.toHaveProperty('avatarUrl')
  })

  it('keeps Create open and intact while mapping safe backend validation feedback', async () => {
    const error = {
      isAxiosError: true,
      message: 'Raw Axios error must not be shown',
      response: {
        data: {
          message: 'The given data was invalid.',
          errors: { 'name.en': ['The English name is required.'] },
        },
      },
    }
    const create = vi.spyOn(testimonialsService, 'create').mockRejectedValueOnce(error)
    const user = userEvent.setup()
    renderPage()
    await openCreate(user)
    await fillCreateForm(user, { isPublished: false })
    const englishName = screen.getByRole('textbox', { name: 'English Name' })

    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('The English name is required.')).toBeInTheDocument()
    expect(create).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(englishName).toHaveValue(createPayload.name.en)
    expect(screen.getByRole('textbox', { name: 'English Comment' })).toHaveValue(createPayload.comment.en)
    expect(screen.getByRole('spinbutton', { name: 'Rating' })).toHaveValue(createPayload.rating)
    expect(toastMocks.error).toHaveBeenCalledTimes(1)
    expect(toastMocks.error).toHaveBeenCalledWith('The given data was invalid.')
    expect(screen.queryByText('Raw Axios error must not be shown')).not.toBeInTheDocument()
  })

  it('creates another once, resets every value and pending avatar, and keeps the drawer open', async () => {
    const create = vi.mocked(testimonialsService.create)
    const avatar = new File(['avatar bytes'], 'temporary-avatar.png', { type: 'image/png' })
    const user = userEvent.setup()
    renderPage()
    await openCreate(user)
    await fillCreateForm(user, { isPublished: false, avatar })

    const createAnother = screen.getByRole('button', { name: 'Create & Create Another' })
    await waitFor(() => expect(createAnother).toBeEnabled())
    await user.click(createAnother)

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith({ ...createPayload, avatar })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: 'English Name' })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: 'Rating' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Sort Order' })).toHaveValue(0)
    expect(screen.getByRole('switch', { name: 'Published' })).toBeChecked()
    expect(screen.queryByRole('button', { name: 'Remove temporary-avatar.png' })).not.toBeInTheDocument()
    expect(screen.getByText('0 images selected')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveFocus())
  })

  it('retains loaded rows and offers retry when the next page fails', async () => {
    vi.mocked(testimonialsService.list).mockImplementation(async (requestedPage) => {
      if (requestedPage === 1) return page(testimonials, 1, 2)
      throw new Error('next page failed')
    })
    renderPage('/dashboard/testimonials?rating=5&sort_by=rating&sort_dir=desc')
    expect(await screen.findAllByText('Sarah Ahmed')).toHaveLength(2)
    await waitFor(() =>
      expect(testimonialsService.list).toHaveBeenCalledWith(
        2,
        expect.any(AbortSignal),
        expect.objectContaining({ rating: 5, createdFrom: '', createdTo: '', sortBy: 'rating', sortDir: 'desc' })
      )
    )
    expect(screen.getAllByText('Sarah Ahmed')).toHaveLength(2)
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
  })

  it('blocks invalid Apply, retains applied filters, and does not request invalid deep links', async () => {
    const list = vi.mocked(testimonialsService.list)
    const user = userEvent.setup()
    renderPage('/dashboard/testimonials?rating=4&sort_by=id&sort_dir=asc')
    await screen.findAllByText('Sarah Ahmed')
    const callsBeforeDraft = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Created From'), '2026-10-10')
    await user.type(screen.getByLabelText('Created To'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(callsBeforeDraft)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The created-from value cannot be after the created-to value.'
    )
    expect(screen.getByLabelText('Created From')).toHaveAttribute(
      'aria-describedby',
      'testimonials-created-range-error'
    )
    expect(screen.getByLabelText('Created To')).toHaveAttribute('aria-invalid', 'true')
    expect(list).toHaveBeenCalledTimes(callsBeforeDraft)
    expect(list.mock.calls.at(-1)?.[2]).toMatchObject({ rating: 4, sortBy: 'id', sortDir: 'asc' })

    list.mockClear()
    renderPage('/dashboard/testimonials?created_from=bad-date&created_to=2026-10-09')
    await waitFor(() => expect(list).not.toHaveBeenCalled())
  })

  it('applies from page one and Reset restores unfiltered page one', async () => {
    const list = vi.mocked(testimonialsService.list)
    const user = userEvent.setup()
    renderPage('/dashboard/testimonials?page=4&rating=3')
    await screen.findAllByText('Sarah Ahmed')
    expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal), expect.objectContaining({ rating: 3 }))
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Created From'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        1,
        expect.any(AbortSignal),
        expect.objectContaining({ rating: 3, createdFrom: '2026-10-01' })
      )
    )
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        1,
        expect.any(AbortSignal),
        expect.objectContaining({ rating: null, createdFrom: '', createdTo: '', sortBy: null, sortDir: null })
      )
    )
  })

  it('uses a stable Index-row snapshot for Edit, performs no Show request, and sends the full body for one changed field', async () => {
    const update = vi.spyOn(testimonialsService, 'update').mockRejectedValueOnce(new Error('update failed'))
    const client = renderPage()
    const user = userEvent.setup()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Edit')
    expect(testimonialsService).not.toHaveProperty('show')
    expect(screen.getByRole('textbox', { name: 'English Name' })).toHaveValue('Sarah Ahmed')

    const rating = screen.getByRole('spinbutton', { name: 'Rating' })
    await user.clear(rating)
    await user.type(rating, '5')
    testimonials = [testimonial({ name: { ar: 'خادم', en: 'Server Changed' }, rating: 2 })]
    await client.invalidateQueries({ queryKey: testimonialsKeys.lists() })
    expect(await screen.findAllByText('Server Changed')).toHaveLength(2)
    expect(rating).toHaveValue(5)

    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(4, fullPayload({ rating: 5 })))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(rating).toHaveValue(5)
  })

  it('keeps pristine Edit disabled and sends no PUT', async () => {
    const update = vi.mocked(testimonialsService.update)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Edit')
    const submit = screen.getByRole('button', { name: 'Update' })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(update).not.toHaveBeenCalled()
  })

  it('omits an untouched persisted avatar and exposes replacement but no persisted-avatar removal', async () => {
    testimonials = [testimonial({ avatarUrl: 'https://cdn.example.com/sarah.png' })]
    const update = vi.mocked(testimonialsService.update)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Edit')
    expect(screen.getByRole('img', { name: 'Avatar for Sarah Ahmed' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/sarah.png'
    )
    expect(screen.getByRole('button', { name: 'Replace Avatar for Sarah Ahmed' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove Avatar for Sarah Ahmed' })).not.toBeInTheDocument()

    const rating = screen.getByRole('spinbutton', { name: 'Rating' })
    await user.clear(rating)
    await user.type(rating, '5')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(4, fullPayload({ rating: 5 })))
    expect(update.mock.calls[0][1]).not.toHaveProperty('avatar')
  })

  it('sends a selected replacement File and clearing it sends no deletion signal', async () => {
    testimonials = [testimonial({ avatarUrl: 'https://cdn.example.com/sarah.png' })]
    const update = vi.spyOn(testimonialsService, 'update').mockRejectedValue(new Error('keep open'))
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Edit')

    const replacement = new File(['new avatar'], 'new-avatar.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Choose a replacement image'), replacement)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(4, fullPayload({ avatar: replacement })))

    await user.click(screen.getByRole('button', { name: 'Remove new-avatar.png' }))
    const rating = screen.getByRole('spinbutton', { name: 'Rating' })
    await user.clear(rating)
    await user.type(rating, '5')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    expect(update.mock.calls[1][1]).toEqual(fullPayload({ rating: 5 }))
    expect(update.mock.calls[1][1]).not.toHaveProperty('avatar')
    expect(update.mock.calls[1][1]).not.toHaveProperty('avatarUrl')
  })

  it('maps backend nested validation to the field, surfaces its safe message, and preserves form values', async () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'The given data was invalid.',
          errors: { 'comment.en': ['The English comment is required.'] },
        },
      },
    }
    vi.spyOn(testimonialsService, 'update').mockRejectedValueOnce(error)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Edit')
    const comment = screen.getByRole('textbox', { name: 'English Comment' })
    await user.clear(comment)
    await user.type(comment, 'Still here')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    expect(await screen.findByText('The English comment is required.')).toBeInTheDocument()
    expect(comment).toHaveValue('Still here')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(toastMocks.error).toHaveBeenCalledWith('The given data was invalid.')
  })

  it('requires identifying confirmation, preserves failure, and prevents duplicate pending Delete', async () => {
    const remove = vi.spyOn(testimonialsService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Sarah Ahmed')
    await openAction(user, 'Delete')
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText(/Sarah Ahmed.*Riyadh.*ID 4/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(remove).not.toHaveBeenCalled()

    remove.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Cannot delete this testimonial.' } },
    })
    await openAction(user, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('Sarah Ahmed').length).toBeGreaterThan(0)
    expect(toastMocks.error).toHaveBeenCalledWith('Cannot delete this testimonial.')

    let finishDelete: (value: { success: boolean; message: string }) => void = () => undefined
    remove.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishDelete = resolve
        })
    )
    await user.dblClick(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2))
    finishDelete({ success: true, message: 'deleted' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
})
