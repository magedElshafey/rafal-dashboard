import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { resetCategoriesMock } from '@/modules/categories/mocks/categories.mock'
import { productsService } from '@/modules/products/api/products.service'
import ProductCreatePage from '@/modules/products/pages/ProductCreatePage'
import { productsKeys } from '@/modules/products/queries/products.keys'

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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard/products/new']}>
        <Routes>
          <Route path="/dashboard/products/new" element={<ProductCreatePage />} />
          <Route path="/dashboard/products" element={<p>Products Index destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { queryClient, invalidate }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Jewelry' }))
  await user.type(screen.getByRole('textbox', { name: 'SKU' }), ' RFL-NEW ')
  await user.type(screen.getByRole('textbox', { name: 'Arabic Name' }), ' منتج جديد ')
  await user.type(screen.getByRole('spinbutton', { name: 'Base Price' }), '25.5')
}

describe('ProductCreatePage', () => {
  beforeEach(async () => {
    resetCategoriesMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the full-page Create sections and uses the established paginated Category selector', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create Product', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pricing & Discount' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personalization' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Images' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Settings' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /slug/i })).not.toBeInTheDocument()

    const category = screen.getByRole('combobox', { name: 'Category' })
    await user.click(category)
    await user.click(await screen.findByRole('option', { name: 'Jewelry' }))
    expect(category).toHaveTextContent('Jewelry')
  })

  it('requires personalization length when enabled and clears dependent values when disabled', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(productsService, 'create')
    renderPage()
    await fillRequiredFields(user)
    const toggle = screen.getByRole('switch', { name: 'Personalizable' })
    const maxLength = screen.getByRole('spinbutton', { name: 'Maximum Personalization Length' })
    const fee = screen.getByRole('spinbutton', { name: 'Personalization Fee' })

    expect(maxLength).toBeDisabled()
    expect(fee).toBeDisabled()
    await user.click(toggle)
    expect(maxLength).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Create Product' }))
    await waitFor(() => expect(maxLength).toHaveAttribute('aria-invalid', 'true'))
    expect(create).not.toHaveBeenCalled()

    await user.type(maxLength, '12')
    await user.type(fee, '3.5')
    await user.click(toggle)
    expect(maxLength).toBeDisabled()
    expect(fee).toBeDisabled()
    expect(maxLength).toHaveValue(null)
    expect(fee).toHaveValue(null)
  })

  it('preserves entered values and hides raw details when Create fails', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce(new Error('unsafe database stack detail'))
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('Product could not be created. Your changes have been preserved.')
    )
    expect(screen.getByRole('textbox', { name: 'SKU' })).toHaveValue(' RFL-NEW ')
    expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(' منتج جديد ')
    expect(screen.getByRole('spinbutton', { name: 'Base Price' })).toHaveValue(25.5)
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Jewelry')
    expect(screen.queryByText('unsafe database stack detail')).not.toBeInTheDocument()
  })

  it('maps Laravel bracket, dot, and image wildcard validation keys to form fields', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          errors: {
            'name[ar]': ['Arabic name from server'],
            'description.en': ['English description from server'],
            'images.0': ['Image from server'],
          },
        },
      },
    })
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Arabic name from server')).toBeInTheDocument()
    expect(screen.getByText('English description from server')).toBeInTheDocument()
    expect(screen.getByText('Image from server')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(' منتج جديد ')
  })

  it('invalidates Product lists and temporarily navigates to Index after successful Create', async () => {
    const create = vi.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 88 })
    const user = userEvent.setup()
    const { invalidate } = renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Products Index destination')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 1,
        sku: 'RFL-NEW',
        name: { ar: 'منتج جديد', en: '' },
        basePrice: 25.5,
        sortOrder: 0,
        images: [],
      })
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
    expect(toastMocks.success).toHaveBeenCalledWith('Product created successfully.')
  })
})
