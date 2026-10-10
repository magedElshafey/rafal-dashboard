import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { categoriesService } from '@/modules/categories/api/categories.service'
import CategoriesPage from '@/modules/categories/pages/CategoriesPage'
import type { CategoriesFilters, Category, CategoryPayload } from '@/modules/categories/types/category.types'

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

const category = (id: number, parentId: number | null = null): Category => ({
  id,
  parent_id: parentId,
  name: { ar: `قسم ${id}`, en: `Category ${id}` },
  slug: `category-${id}`,
  description: id % 3 === 0 ? null : { ar: `وصف ${id}`, en: `Description ${id}` },
  is_active: id % 2 === 1,
  sort_order: id,
  image_url: id % 2 === 1 ? `https://example.test/category-${id}.jpg` : null,
  children_count: 0,
  created_at: '2026-09-06T20:01:03+00:00',
  updated_at: '2026-09-06T20:01:03+00:00',
})

let categoryStore: Category[] = []

function initialCategories() {
  return Array.from({ length: 12 }, (_, index) => category(index + 1, index === 1 ? 1 : null)).map((item) => {
    if (item.id === 1) return { ...item, name: { ar: 'مجوهرات', en: 'Jewelry' }, slug: 'jewelry' }
    if (item.id === 2) return { ...item, name: { ar: 'خواتم', en: 'Rings' }, slug: 'rings' }
    return item
  })
}

function installCategoryServiceFixtures() {
  const pageSize = 15
  vi.spyOn(categoriesService, 'list').mockImplementation(async (_filters: CategoriesFilters, page) => {
    const start = (page - 1) * pageSize
    const items = categoryStore.slice(start, start + pageSize)
    const totalPages = Math.max(1, Math.ceil(categoryStore.length / pageSize))
    return {
      items,
      paginate: {
        current_page: page,
        total_pages: totalPages,
        per_page: pageSize,
        total: categoryStore.length,
        count: items.length,
        next_page_url: page < totalPages ? String(page + 1) : null,
        prev_page_url: page > 1 ? String(page - 1) : null,
      },
      extra: null,
    }
  })
  vi.spyOn(categoriesService, 'show').mockImplementation(async (id) => {
    const item = categoryStore.find((candidate) => candidate.id === id)
    if (!item) throw new Error('Category not found')
    return { success: true, message: 'ok', data: item }
  })
  vi.spyOn(categoriesService, 'create').mockImplementation(async (payload: CategoryPayload) => {
    const id = Math.max(0, ...categoryStore.map((item) => item.id)) + 1
    const created: Category = {
      id,
      parent_id: payload.parent_id,
      name: payload.name,
      slug: 'backend-owned',
      description: payload.description ?? null,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
      image_url: `https://example.test/category-${id}.jpg`,
      children_count: 0,
      created_at: '2026-09-28T00:00:00+00:00',
      updated_at: '2026-09-28T00:00:00+00:00',
    }
    categoryStore.unshift(created)
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(categoriesService, 'update').mockImplementation(async (id, payload) => {
    const index = categoryStore.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Category not found')
    const updated: Category = {
      ...categoryStore[index],
      parent_id: payload.parent_id,
      name: payload.name,
      description: payload.description ?? categoryStore[index].description,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
      image_url: payload.image ? `https://example.test/category-${id}-replacement.jpg` : categoryStore[index].image_url,
    }
    categoryStore[index] = updated
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(categoriesService, 'delete').mockImplementation(async (id) => {
    categoryStore = categoryStore.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage(initialEntry = '/dashboard/categories') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>, suffix = '') {
  await user.type(screen.getByRole('textbox', { name: /^Arabic Name/ }), `قسم جديد${suffix}`)
  await user.type(screen.getByRole('textbox', { name: /^English Name/ }), `New Category${suffix}`)
  await user.upload(
    screen.getByLabelText('Browse images'),
    new File(['category-image'], `category${suffix || '-new'}.png`, { type: 'image/png' })
  )
}

describe('CategoriesPage', () => {
  beforeEach(async () => {
    categoryStore = initialCategories()
    installCategoryServiceFixtures()
    let objectUrl = 0
    URL.createObjectURL = vi.fn(() => `blob:category-${++objectUrl}`)
    URL.revokeObjectURL = vi.fn()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders mirrored paginated hierarchy with image fallbacks and the filter trigger', async () => {
    categoryStore = Array.from({ length: 16 }, (_, index) => category(index + 1, index === 1 ? 1 : null))
    const list = vi.mocked(categoriesService.list)
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8)
    expect(await screen.findAllByText('Category 16')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('Root Category').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Child of Category 1').length).toBeGreaterThan(1)
    expect(screen.getAllByRole('img', { name: 'Category 1' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('img', { name: 'No image' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    expect(list.mock.calls.map(([, page]) => page)).toEqual([1, 2])
    expect(list.mock.calls.every(([filters]) => filters.isActive === null)).toBe(true)
  })

  it('retains filters on next pages, restarts pagination after Apply, and resets to the unfiltered list', async () => {
    categoryStore = Array.from({ length: 16 }, (_, index) => category(index + 1))
    const list = vi.mocked(categoriesService.list)
    const user = userEvent.setup()

    renderPage('/dashboard/categories?page=4&is_active=0')

    expect(await screen.findAllByText('Category 16')).toHaveLength(2)
    await waitFor(() => expect(list.mock.calls.some(([, page]) => page === 2)).toBe(true))
    expect(list.mock.calls.filter(([, page]) => page <= 2).every(([filters]) => filters.isActive === false)).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('combobox', { name: 'Active' }))
    await user.click(screen.getByRole('option', { name: 'Yes' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(list.mock.calls.some(([filters, page]) => filters.isActive === true && page === 1)).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(list.mock.calls.some(([filters, page]) => filters.isActive === null && page === 1)).toBe(true)
    )
  })

  it('surfaces an invalid created range only after Apply and keeps the draft dialog open without querying', async () => {
    const list = vi.mocked(categoriesService.list)
    const user = userEvent.setup()

    renderPage()

    await screen.findAllByText('Jewelry')
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Created from'), '2026-10-10')
    await user.type(screen.getByLabelText('Created to'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('Created from')).not.toHaveAttribute('aria-describedby')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The created-from date cannot be after the created-to date.'
    )
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-describedby', 'categories-created-range-error')
    expect(screen.getByLabelText('Created from')).toHaveValue('2026-10-10')
    expect(screen.getByLabelText('Created to')).toHaveValue('2026-10-09')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
  })

  it('does not request an invalid deep-linked created range', async () => {
    const list = vi.mocked(categoriesService.list)
    const user = userEvent.setup()

    renderPage('/dashboard/categories?created_from=2026-10-10&created_to=2026-10-09')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(screen.getByLabelText('Created from')).toHaveValue('2026-10-10')
    expect(screen.getByLabelText('Created to')).toHaveValue('2026-10-09')
    expect(list).not.toHaveBeenCalled()
  })

  it('uses standard empty and safe retry states', async () => {
    categoryStore = []
    vi.mocked(categoriesService.list).mockRejectedValueOnce(new Error('unsafe database detail'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No categories yet')).toBeInTheDocument()
  })

  it('validates bilingual names, image, and non-negative integer sort order without a slug field', async () => {
    const create = vi.mocked(categoriesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    const order = screen.getByRole('spinbutton', { name: /^Sort Order/ })
    await user.clear(order)
    await user.type(order, '-1')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Arabic name is required.')).toBeInTheDocument()
    expect(screen.getByText('English name is required.')).toBeInTheDocument()
    expect(screen.getByText('Sort order cannot be negative.')).toBeInTheDocument()
    expect(screen.getByText('An image is required.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /slug/i })).not.toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a root category with optional empty descriptions', async () => {
    const create = vi.mocked(categoriesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user)
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('No parent / Root category')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_id: null,
        description: null,
        sort_order: 0,
        image: expect.any(File),
      })
    )
    expect(create.mock.calls[0][0]).not.toHaveProperty('slug')
    expect(await screen.findAllByText('New Category')).toHaveLength(2)
  })

  it('keeps exactly one selected image in single-image mode', async () => {
    const create = vi.mocked(categoriesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user)
    const input = screen.getByLabelText('Browse images')
    const replacement = new File(['replacement'], 'replacement.webp', { type: 'image/webp' })
    expect(input).not.toHaveAttribute('multiple')
    await user.upload(input, replacement)
    expect(screen.getByText('1 image selected')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'category-new.png' })).not.toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'replacement.webp' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(create).toHaveBeenCalled())
    expect(create.mock.calls[0][0].image).toBe(replacement)
  })

  it('creates a child using a remote localized parent option stored as a numeric id', async () => {
    const create = vi.mocked(categoriesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    await user.click(screen.getByRole('option', { name: 'Jewelry' }))
    await user.type(screen.getByRole('textbox', { name: /^Arabic Name/ }), 'قسم فرعي')
    await user.type(screen.getByRole('textbox', { name: /^English Name/ }), 'Child Category')
    expect(screen.queryByLabelText('Browse images')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Arabic Description' })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'English Description' })).not.toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /^Sort Order/ })).toHaveValue(0)
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith({
      parent_id: 1,
      name: { ar: 'قسم فرعي', en: 'Child Category' },
      is_active: true,
      sort_order: 0,
    })
  })

  it('edits a child without main-category media and description fields', async () => {
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Rings', 'Edit')
    expect(await screen.findByRole('textbox', { name: /^English Name/ })).toHaveValue('Rings')
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('Jewelry')
    expect(screen.queryByLabelText('Browse images')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Description/ })).not.toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /^Sort Order/ })).toHaveValue(2)
    expect(screen.getByRole('checkbox', { name: 'Active' })).not.toBeChecked()
  })

  it('create another resets localized values, parent, sort order, and errors', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user)
    const order = screen.getByRole('spinbutton', { name: /^Sort Order/ })
    await user.clear(order)
    await user.type(order, '5')
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    await user.click(screen.getByRole('option', { name: 'Jewelry' }))
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Arabic Name/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /^English Name/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /^Sort Order/ })).toHaveValue(0)
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('No parent / Root category')
    expect(screen.getByText('0 images selected')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('loads show data, current parent, nullable media/description, and excludes direct self-parenting', async () => {
    const show = vi.mocked(categoriesService.show)
    const update = vi.mocked(categoriesService.update)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Rings', 'Edit')
    expect(await screen.findByRole('textbox', { name: /^English Name/ })).toHaveValue('Rings')
    expect(show).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('Jewelry')
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    expect(screen.queryByRole('option', { name: 'Rings' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByLabelText('Browse images')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })

  it('enables a dirty update and submits normalized hierarchy values', async () => {
    const update = vi.mocked(categoriesService.update)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Jewelry', 'Edit')
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('img', { name: 'Jewelry' })).toHaveAttribute(
      'src',
      'https://example.test/category-1.jpg'
    )
    expect(within(dialog).queryByRole('button', { name: 'Remove Jewelry' })).not.toBeInTheDocument()
    expect(within(dialog).getByText('1 image selected')).toBeInTheDocument()
    const name = await screen.findByRole('textbox', { name: /^English Name/ })
    await user.clear(name)
    await user.type(name, 'Fine Jewelry')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update).toHaveBeenCalledWith(1, {
      parent_id: null,
      name: { ar: 'مجوهرات', en: 'Fine Jewelry' },
      description: expect.any(Object),
      is_active: true,
      sort_order: 1,
    })
    expect(update.mock.calls[0][1]).not.toHaveProperty('image')
    expect(update.mock.calls[0][1]).not.toHaveProperty('slug')
  })

  it('submits one local replacement for the existing remote image', async () => {
    const update = vi.mocked(categoriesService.update)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Jewelry', 'Edit')
    const dialog = await screen.findByRole('dialog')
    const replacement = new File(['replacement'], 'replacement.png', { type: 'image/png' })
    await user.click(within(dialog).getByRole('button', { name: 'Replace Jewelry' }))
    await user.upload(within(dialog).getByLabelText('Choose a replacement image'), replacement)
    expect(within(dialog).getByText('1 image selected')).toBeInTheDocument()
    expect(await within(dialog).findByRole('img', { name: 'replacement.png' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0][1].image).toBe(replacement)
  })

  it('preserves edit values when update fails', async () => {
    vi.mocked(categoriesService.update).mockRejectedValueOnce(new Error('unsafe update detail'))
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Jewelry', 'Edit')
    const name = await screen.findByRole('textbox', { name: /^English Name/ })
    await user.clear(name)
    await user.type(name, 'Preserved Jewelry')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Category could not be updated.'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(name).toHaveValue('Preserved Jewelry')
    expect(screen.queryByText('unsafe update detail')).not.toBeInTheDocument()
  })

  it('shows a safe detail retry state', async () => {
    vi.mocked(categoriesService.show).mockRejectedValueOnce(new Error('unsafe detail'))
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Jewelry', 'Edit')
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByTestId('query-state-loading-error')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /try again/i }))
    expect(await within(dialog).findByRole('textbox', { name: /^English Name/ })).toHaveValue('Jewelry')
  })

  it('requires delete confirmation and prevents duplicate deletion', async () => {
    categoryStore = [category(20)]
    const remove = vi.mocked(categoriesService.delete)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Category 20', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Category 20')).not.toBeInTheDocument()
  })

  it('uses Arabic names and preserves field-level direction in RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findAllByText('مجوهرات')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'إنشاء قسم' }))
    expect(screen.getByRole('textbox', { name: /^الاسم بالعربية/ })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('textbox', { name: /^الاسم بالإنجليزية/ })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('textbox', { name: /^الوصف بالعربية/ })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('spinbutton', { name: /^ترتيب العرض/ })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('combobox', { name: 'القسم الرئيسي' })).toHaveAttribute('dir', 'rtl')
  })
})
