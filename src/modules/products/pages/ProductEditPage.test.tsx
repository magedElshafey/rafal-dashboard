import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { productMediaService } from '@/modules/products/api/product-media.service'
import { productsService } from '@/modules/products/api/products.service'
import ProductEditPage from '@/modules/products/pages/ProductEditPage'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

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

const product: ProductDetail = {
  id: 7,
  categoryId: 1,
  sku: 'ORIGINAL',
  name: { ar: 'منتج', en: 'Product' },
  description: { ar: '<p>وصف</p>', en: '<p>Hello</p>' },
  slug: 'server-only',
  basePrice: 50,
  discountPercentage: 10,
  discountEndAt: '2026-10-03 14:05:00',
  isPersonalizable: true,
  personalizationMaxLength: 20,
  personalizationFee: 5,
  hidePriceOnPackaging: false,
  isNewArrival: true,
  isActive: true,
  sortOrder: 2,
  simulatedViewersCount: 10,
  simulatedOrdersCount: 3,
  variants: [],
  images: [
    { id: 12, url: 'https://example.com/image.jpg' },
    { id: 13, url: 'https://example.com/image-2.jpg' },
  ],
  createdAt: 'created',
  updatedAt: 'updated',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard/products/7/edit']}>
        <Routes>
          <Route path="/dashboard/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/dashboard/products" element={<p>Index</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return queryClient
}

describe('ProductEditPage', () => {
  beforeEach(async () => {
    vi.spyOn(productsService, 'show').mockResolvedValue({ ...product })
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    URL.createObjectURL = vi.fn(() => 'blob:new-image')
    URL.revokeObjectURL = vi.fn()
    await i18n.changeLanguage('en')
  })
  afterEach(() => vi.restoreAllMocks())

  it('waits for Show, hydrates a pristine form, and displays existing images with accessible delete controls', async () => {
    renderPage()
    expect(screen.queryByRole('textbox', { name: 'SKU' })).not.toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'SKU' })).toHaveValue('ORIGINAL')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('img', { name: 'Existing product image 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete existing product image 12' })).toBeInTheDocument()
  })

  it('sends only one dirty field and resets to the authoritative response after success', async () => {
    const update = vi
      .spyOn(productsService, 'update')
      .mockResolvedValue({ ...product, sku: 'AUTHORITATIVE', updatedAt: 'new' })
    const user = userEvent.setup()
    const queryClient = renderPage()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const sku = await screen.findByRole('textbox', { name: 'SKU' })
    await user.clear(sku)
    await user.type(sku, 'CHANGED')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(sku).toHaveValue('AUTHORITATIVE'))
    expect(update).toHaveBeenCalledWith(7, { sku: 'CHANGED' })
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(queryClient.getQueryData(productsKeys.detail(7))).toMatchObject({ sku: 'AUTHORITATIVE' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
    expect(toastMocks.success).toHaveBeenCalledWith('Product updated successfully.')
  })

  it('enables Save only for dirty valid values', async () => {
    const user = userEvent.setup()
    renderPage()
    const arabicName = await screen.findByRole('textbox', { name: 'Arabic Name' })
    const save = screen.getByRole('button', { name: 'Save Changes' })
    await user.clear(arabicName)
    expect(save).toBeDisabled()
    await user.type(arabicName, 'اسم صالح')
    await waitFor(() => expect(save).toBeEnabled())
  })

  it('preserves dirty edits on failed saves and background detail changes', async () => {
    vi.spyOn(productsService, 'update').mockRejectedValueOnce(new Error('unsafe detail'))
    const user = userEvent.setup()
    const queryClient = renderPage()
    const sku = await screen.findByRole('textbox', { name: 'SKU' })
    await user.clear(sku)
    await user.type(sku, 'UNSAVED')
    queryClient.setQueryData(productsKeys.detail(7), { ...product, sku: 'REFETCHED', updatedAt: 'later' })
    await waitFor(() => expect(sku).toHaveValue('UNSAVED'))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('Product could not be updated. Your changes have been preserved.')
    )
    expect(sku).toHaveValue('UNSAVED')
    expect(screen.queryByText('unsafe detail')).not.toBeInTheDocument()
  })

  it('requires confirmation and removes only the confirmed remote image after success', async () => {
    const remove = vi.spyOn(productMediaService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const user = userEvent.setup()
    const queryClient = renderPage()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await screen.findByRole('img', { name: 'Existing product image 12' })
    await user.click(screen.getByRole('button', { name: 'Delete existing product image 12' }))
    expect(remove).not.toHaveBeenCalled()
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete image' }))
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: 'Existing product image 12' })).not.toBeInTheDocument()
    )
    expect(screen.getByRole('img', { name: 'Existing product image 13' })).toBeInTheDocument()
    expect(remove).toHaveBeenCalledWith(12)
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
  })

  it('scopes pending state to the selected image and prevents duplicate submission', async () => {
    let resolveDelete!: (value: { success: boolean; message: string }) => void
    const remove = vi.spyOn(productMediaService, 'delete').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        })
    )
    const user = userEvent.setup()
    renderPage()
    const firstAction = await screen.findByRole('button', { name: 'Delete existing product image 12' })
    const secondAction = screen.getByRole('button', { name: 'Delete existing product image 13' })
    await user.click(firstAction)
    const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete image' })

    await user.click(confirm)
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(firstAction).toBeDisabled()
    expect(firstAction.querySelector('.animate-spin')).toBeInTheDocument()
    expect(secondAction).toBeEnabled()
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(remove).toHaveBeenCalledTimes(1)

    await act(async () => resolveDelete({ success: true, message: 'deleted' }))
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: 'Existing product image 12' })).not.toBeInTheDocument()
    )
  })

  it('keeps the remote image after a failed media delete', async () => {
    vi.spyOn(productMediaService, 'delete').mockRejectedValueOnce(new Error('unsafe media detail'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('img', { name: 'Existing product image 12' })
    await user.click(screen.getByRole('button', { name: 'Delete existing product image 12' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete image' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('img', { name: 'Existing product image 12' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Existing product image 13' })).toBeInTheDocument()
    expect(screen.queryByText('unsafe media detail')).not.toBeInTheDocument()
  })

  it('removes an unsaved local image without calling media DELETE', async () => {
    const remove = vi.spyOn(productMediaService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('textbox', { name: 'SKU' })
    await user.upload(screen.getByLabelText('Browse images'), new File(['new'], 'new.png', { type: 'image/png' }))
    await user.click(await screen.findByRole('button', { name: 'Remove new.png' }))
    expect(screen.queryByRole('img', { name: 'new.png' })).not.toBeInTheDocument()
    expect(remove).not.toHaveBeenCalled()
  })
})
