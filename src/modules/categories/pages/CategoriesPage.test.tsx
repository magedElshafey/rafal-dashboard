import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { categoriesService } from '@/modules/categories/api/categories.service'
import { resetCategoriesMock, seedCategoriesMock } from '@/modules/categories/mocks/categories.mock'
import CategoriesPage from '@/modules/categories/pages/CategoriesPage'
import type { Category } from '@/modules/categories/types/category.types'

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoriesPage />
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
  await user.type(screen.getByRole('textbox', { name: /^Slug/ }), `new-category${suffix}`)
}

describe('CategoriesPage', () => {
  beforeEach(async () => {
    resetCategoriesMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders mirrored paginated hierarchy with image fallbacks and no search/filter controls', async () => {
    seedCategoriesMock(Array.from({ length: 16 }, (_, index) => category(index + 1, index === 1 ? 1 : null)))
    const list = vi.spyOn(categoriesService, 'list')
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
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument()
  })

  it('uses standard empty and safe retry states', async () => {
    seedCategoriesMock([])
    const originalList = categoriesService.list
    const list = vi.spyOn(categoriesService, 'list').mockRejectedValueOnce(new Error('unsafe database detail'))
    list.mockImplementation(originalList)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No categories yet')).toBeInTheDocument()
  })

  it('validates bilingual names, explicit slug, and non-negative integer sort order', async () => {
    const create = vi.spyOn(categoriesService, 'create')
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
    expect(screen.getByText('Slug is required.')).toBeInTheDocument()
    expect(screen.getByText('Sort order cannot be negative.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a root category with optional empty descriptions', async () => {
    const create = vi.spyOn(categoriesService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user)
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('No parent / Root category')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ parent_id: null, description: null, sort_order: 0 }))
    expect(await screen.findAllByText('New Category')).toHaveLength(2)
  })

  it('creates a child using a remote localized parent option stored as a numeric id', async () => {
    const create = vi.spyOn(categoriesService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user, '-child')
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    await user.click(screen.getByRole('option', { name: 'Jewelry' }))
    await user.type(screen.getByRole('textbox', { name: 'English Description' }), 'Optional description')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_id: 1,
        description: { ar: '', en: 'Optional description' },
      })
    )
  })

  it('create another resets localized values, parent, sort order, and errors', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Jewelry')
    await user.click(screen.getByRole('button', { name: 'Create Category' }))
    await fillRequired(user)
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    await user.click(screen.getByRole('option', { name: 'Jewelry' }))
    const order = screen.getByRole('spinbutton', { name: /^Sort Order/ })
    await user.clear(order)
    await user.type(order, '5')
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Arabic Name/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /^English Name/ })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /^Slug/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /^Sort Order/ })).toHaveValue(0)
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('No parent / Root category')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('loads show data, current parent, nullable media/description, and excludes direct self-parenting', async () => {
    const show = vi.spyOn(categoriesService, 'show')
    const update = vi.spyOn(categoriesService, 'update')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Rings', 'Edit')
    expect(screen.getByRole('dialog').querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: /^English Name/ })).toHaveValue('Rings')
    expect(show).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(screen.getByRole('combobox', { name: 'Parent Category' })).toHaveTextContent('Jewelry')
    await user.click(screen.getByRole('combobox', { name: 'Parent Category' }))
    expect(screen.queryByRole('option', { name: 'Rings' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('img', { name: 'No image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })

  it('enables a dirty update and submits normalized hierarchy values', async () => {
    const update = vi.spyOn(categoriesService, 'update')
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Rings', 'Edit')
    const name = await screen.findByRole('textbox', { name: /^English Name/ })
    await user.clear(name)
    await user.type(name, 'Fine Rings')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ parent_id: 1, name: expect.objectContaining({ en: 'Fine Rings' }) })
    )
  })

  it('shows a safe detail retry state', async () => {
    const originalShow = categoriesService.show
    const show = vi.spyOn(categoriesService, 'show').mockRejectedValueOnce(new Error('unsafe detail'))
    show.mockImplementation(originalShow)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Jewelry', 'Edit')
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByTestId('query-state-loading-error')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /try again/i }))
    expect(await within(dialog).findByRole('textbox', { name: /^English Name/ })).toHaveValue('Jewelry')
  })

  it('requires delete confirmation and prevents duplicate deletion', async () => {
    seedCategoriesMock([category(20)])
    const remove = vi.spyOn(categoriesService, 'delete')
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
