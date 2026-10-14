import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { Combobox } from './combobox'

const first = { value: '22', label: 'Product 22' }
const second = { value: '23', label: 'Product 23' }
function scroll(top: number, height = 600) {
  const viewport = screen.getByRole('listbox')
  Object.defineProperties(viewport, {
    scrollHeight: { configurable: true, value: height },
    clientHeight: { configurable: true, value: 300 },
    scrollTop: { configurable: true, value: top },
  })
  fireEvent.scroll(viewport)
  return viewport
}
function pagination(overrides = {}) {
  return {
    hasNextPage: true, isFetching: false, isLoading: false, isError: false,
    onLoadMore: vi.fn(async () => {}), onRetry: vi.fn(async () => {}),
    loadingMessage: i18n.t('inventory.filters.loadingProducts'),
    moreMessage: i18n.t('inventory.filters.scrollProducts'),
    errorMessage: i18n.t('inventory.filters.productsError'),
    retryLabel: i18n.t('inventory.filters.retry'), ...overrides,
  }
}
beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})
afterEach(() => vi.unstubAllGlobals())

describe('opt-in Combobox pagination', () => {
  it('fetches once near the bottom, retains options and selection, and stops at the last page', async () => {
    let finish: () => void = () => {}
    const more = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const paging = pagination({ onLoadMore: more })
    const props = { data: [first], value: first, valueKey: 'value' as const, labelKey: 'label' as const, 'aria-label': 'Product' }
    const view = render(<Combobox {...props} pagination={paging} />)
    expect(more).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('combobox', { name: 'Product' }))
    expect(more).not.toHaveBeenCalled()
    scroll(100)
    expect(more).not.toHaveBeenCalled()
    const viewport = scroll(270)
    await waitFor(() => expect(more).toHaveBeenCalledTimes(1))
    scroll(280)
    view.rerender(<Combobox {...props} pagination={{ ...paging, isFetching: true }} />)
    scroll(290)
    expect(more).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('option', { name: 'Product 22' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('inventory.filters.loadingProducts'))
    await act(async () => finish())
    view.rerender(<Combobox {...props} data={[first, second]} pagination={paging} />)
    expect(screen.getByRole('listbox')).toBe(viewport)
    expect(viewport.scrollTop).toBe(290)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(screen.getByRole('combobox', { name: 'Product' })).toHaveTextContent('Product 22')
    scroll(295) // Same extent must not repeat a completed request.
    expect(more).toHaveBeenCalledTimes(1)
    scroll(570, 900)
    await waitFor(() => expect(more).toHaveBeenCalledTimes(2))
    await act(async () => finish())
    view.rerender(<Combobox {...props} data={[first, second]} pagination={{ ...paging, hasNextPage: false }} />)
    scroll(880, 1200)
    expect(more).toHaveBeenCalledTimes(2)
    await userEvent.keyboard('{Escape}')
    view.rerender(<Combobox {...props} pagination={paging} />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(more).toHaveBeenCalledTimes(2)
  })

  it.each(['en', 'ar'])('shows localized next-page failure and retries inside the open dropdown in %s', async language => {
    await i18n.changeLanguage(language)
    const more = vi.fn(async () => { throw new Error('offline') })
    const retry = vi.fn(async () => {})
    const paging = pagination({ onLoadMore: more, onRetry: retry })
    const props = { data: [first], value: first, valueKey: 'value' as const, labelKey: 'label' as const, 'aria-label': 'Product' }
    const view = render(<Combobox {...props} pagination={paging} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Product' }))
    scroll(270)
    await waitFor(() => expect(more).toHaveBeenCalledTimes(1))
    view.rerender(<Combobox {...props} pagination={{ ...paging, isError: true }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('inventory.filters.productsError'))
    expect(screen.getByRole('option', { name: 'Product 22' })).toBeInTheDocument()
    scroll(580, 900)
    expect(more).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: i18n.t('inventory.filters.retry') }))
    await waitFor(() => expect(retry).toHaveBeenCalledTimes(1))
    view.rerender(<Combobox {...props} data={[first, second]} pagination={paging} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('does not cascade on short lists or local search and does not claim the catalog is empty', async () => {
    const paging = pagination()
    render(<Combobox data={[first]} valueKey="value" labelKey="label" aria-label="Product" pagination={paging} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    scroll(0, 100)
    expect(paging.onLoadMore).not.toHaveBeenCalled()
    await user.type(screen.getByPlaceholderText(i18n.t('label.search')), 'unloaded')
    expect(screen.queryByText(i18n.t('label.no_data'))).not.toBeInTheDocument()
    expect(screen.getByText(i18n.t('inventory.filters.scrollProducts'))).toBeInTheDocument()
    expect(paging.onLoadMore).not.toHaveBeenCalled()
  })

  it('preserves selection and clearing without opting into pagination', async () => {
    const change = vi.fn()
    render(<Combobox data={[first]} value={first} valueKey="value" labelKey="label" aria-label="Product" onChange={change} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Product' }))
    await userEvent.click(screen.getByRole('option', { name: 'Product 22' }))
    expect(change).toHaveBeenCalledWith(null)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
