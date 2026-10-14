import type { ComponentProps } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import type { Banner } from '../types/banner.types'
import { BannerForm } from './BannerForm'

const options = vi.hoisted(() => ({ absent: false, pending: false }))
vi.mock('@/modules/products/hooks/useProducts', () => ({
  useProducts: () => ({
    data: { pages: [{ items: options.absent ? [] : [{ id: 37, name: { en: 'Saved product', ar: 'المنتج المحفوظ' } }] }] },
    isLoading: false, isFetching: false, isError: false, hasNextPage: false,
  }),
}))
vi.mock('@/modules/products/hooks/useProduct', () => ({
  useProduct: (id: number | null) => ({
    data: id && !options.pending ? { id, name: { en: 'Saved product', ar: 'المنتج المحفوظ' } } : undefined,
    isLoading: Boolean(id && options.pending), isFetching: Boolean(id && options.pending), isError: false,
  }),
}))
vi.mock('@/modules/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    data: { pages: [{ items: options.absent ? [] : [{ id: 12, name: { en: 'Saved category', ar: 'التصنيف المحفوظ' } }] }] },
    isLoading: false, isFetching: false, isError: false, hasNextPage: false,
  }),
}))
vi.mock('@/modules/categories/hooks/useCategory', () => ({
  useCategory: (id: number | null) => ({
    data: id && !options.pending ? { data: { id, name: { en: 'Saved category', ar: 'التصنيف المحفوظ' } } } : undefined,
    isLoading: Boolean(id && options.pending), isFetching: Boolean(id && options.pending), isError: false,
  }),
}))

const saved: Banner = {
  id: 42, placement: 'splash', title: { ar: 'عنوان', en: 'Title' }, link_url: null,
  position: 'hero', product_id: 37, category_id: null, platform: 'mobile',
  starts_at: null, ends_at: null, is_active: false, sort_order: 9,
  image_url: 'https://example.test/banner.png', created_at: '', updated_at: '',
}

function select(field: string) {
  return screen.getByRole('combobox', { name: name => name.startsWith(i18n.t('banners.fields.' + field)) })
}

function renderForm(banner = saved) {
  const onDirtyChange = vi.fn()
  const onSubmit = vi.fn<ComponentProps<typeof BannerForm>['onSubmit']>(async () => {})
  const form = () => <>
    <BannerForm formId="test-banner" mode="edit" banner={banner} isSubmitting={false}
      onDirtyChange={onDirtyChange} onSubmit={onSubmit} />
    <button type="submit" form="test-banner">Submit</button>
  </>
  const view = render(form())
  return { ...view, onSubmit, onDirtyChange, hydrate: () => view.rerender(form()) }
}

beforeEach(async () => {
  options.absent = false
  options.pending = false
  await i18n.changeLanguage('en')
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

describe('Banner edit hydration', () => {
  it.each(['product', 'category'] as const)('prefills %s and preserves untouched fields on submit', async type => {
    const user = userEvent.setup()
    const record = { ...saved, product_id: type === 'product' ? 37 : null, category_id: type === 'category' ? 12 : null }
    const view = renderForm(record)
    expect(select('position')).toHaveTextContent('Hero')
    expect(select('destinationType')).toHaveTextContent(type === 'product' ? 'Product' : 'Category')
    expect(select(type)).toHaveTextContent('Saved ' + type)
    expect(screen.queryByRole('combobox', { name: /^Placement/ })).not.toBeInTheDocument()
    expect(view.onDirtyChange).not.toHaveBeenCalledWith(true)
    await user.type(screen.getByRole('textbox', { name: /^English Title/ }), ' edited')
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(view.onSubmit).toHaveBeenCalled())
    expect(view.onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      position: 'hero', destination_type: type, product_id: record.product_id, category_id: record.category_id,
      platform: 'mobile', is_active: false, sort_order: 9, starts_at: '', ends_at: '',
    }))
  })

  it.each([
    ['product', 'en', 'Saved product'], ['product', 'ar', 'المنتج المحفوظ'],
    ['category', 'en', 'Saved category'], ['category', 'ar', 'التصنيف المحفوظ'],
  ] as const)('hydrates an off-page %s in %s without erasing its ID or marking dirty', async (type, language, label) => {
    options.absent = true
    options.pending = true
    await i18n.changeLanguage(language)
    const view = renderForm({ ...saved, product_id: type === 'product' ? 37 : null, category_id: type === 'category' ? 12 : null })
    expect(view.onDirtyChange).not.toHaveBeenCalledWith(true)
    options.pending = false
    view.hydrate()
    await waitFor(() => expect(select(type)).toHaveTextContent(label))
    expect(view.onDirtyChange).not.toHaveBeenCalledWith(true)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(view.onSubmit).toHaveBeenCalled())
    expect(view.onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      product_id: type === 'product' ? 37 : null, category_id: type === 'category' ? 12 : null,
    }))
  })

  it('clears the old destination when switching in either direction', async () => {
    const user = userEvent.setup()
    const view = renderForm()
    await user.click(select('destinationType'))
    await user.click(screen.getByRole('option', { name: 'Category', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(view.onSubmit).not.toHaveBeenCalled()
    await user.click(select('category'))
    await user.click(screen.getByRole('option', { name: 'Saved category' }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1))
    expect(view.onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ product_id: null, category_id: 12 }))
    await user.click(select('destinationType'))
    await user.click(screen.getByRole('option', { name: 'Product', exact: true }))
    expect(select('product')).not.toHaveTextContent('Saved product')
    await user.click(select('product'))
    await user.click(screen.getByRole('option', { name: 'Saved product' }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(2))
    expect(view.onSubmit.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ product_id: 37, category_id: null }))
  })

  it.each([
    { product_id: null, category_id: null }, { product_id: 37, category_id: 12 },
  ])('requires explicit correction of invalid destination %s', async destination => {
    const user = userEvent.setup()
    const view = renderForm({ ...saved, ...destination })
    expect(select('destinationType')).not.toHaveTextContent(/Product|Category/)
    expect(view.onDirtyChange).not.toHaveBeenCalledWith(true)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(view.onSubmit).not.toHaveBeenCalled()
    await user.click(select('destinationType'))
    await user.click(screen.getByRole('option', { name: 'Category', exact: true }))
    await user.click(select('category'))
    await user.click(screen.getByRole('option', { name: 'Saved category' }))
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(view.onSubmit).toHaveBeenCalled())
    expect(view.onSubmit.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ product_id: null, category_id: 12 }))
  })

  it('does not invent a position for missing or normalized-invalid data', async () => {
    const view = renderForm({ ...saved, position: null })
    expect(select('position')).not.toHaveTextContent('Hero')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Submit' }))
    expect(view.onSubmit).not.toHaveBeenCalled()
  })
})
