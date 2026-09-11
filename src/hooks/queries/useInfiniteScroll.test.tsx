import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useInfiniteScroll } from '@/hooks/queries/useInfiniteScroll'

type InfiniteScrollHarnessProps = {
  enabled?: boolean
  onLoadMore: () => void | Promise<unknown>
  operationKey?: string
  rootMargin?: string
}

function InfiniteScrollHarness({ enabled = true, onLoadMore, operationKey, rootMargin }: InfiniteScrollHarnessProps) {
  const triggerRef = useInfiniteScroll({ enabled, onLoadMore, operationKey, rootMargin })

  return <div ref={triggerRef} data-testid="infinite-scroll-trigger" />
}

function createDeferred() {
  let resolvePromise: (() => void) | undefined
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve: () => resolvePromise?.(),
  }
}

type IntersectionObserverMockInstance = {
  callback: IntersectionObserverCallback
  disconnect: ReturnType<typeof vi.fn>
}

function installIntersectionObserverMock() {
  const instances: IntersectionObserverMockInstance[] = []

  class IntersectionObserverMock {
    readonly root = null
    readonly rootMargin = '0px'
    readonly thresholds = [0]
    readonly disconnect = vi.fn()
    readonly observe = vi.fn()
    readonly takeRecords = vi.fn(() => [])
    readonly unobserve = vi.fn()

    constructor(readonly callback: IntersectionObserverCallback) {
      instances.push(this)
    }
  }

  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

  return instances
}

function getObserverInstance(instances: IntersectionObserverMockInstance[], index: number) {
  const instance = instances[index]

  if (!instance) {
    throw new Error(`Expected IntersectionObserver instance ${index}`)
  }

  return instance
}

async function intersect(instance: IntersectionObserverMockInstance) {
  await act(async () => {
    instance.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      instance as unknown as IntersectionObserver
    )
    await Promise.resolve()
  })
}

async function settleDeferred(deferred: ReturnType<typeof createDeferred>) {
  await act(async () => {
    deferred.resolve()
    await deferred.promise
    await Promise.resolve()
  })
}

describe('useInfiniteScroll operation generations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts an intersecting replacement operation while the previous generation remains pending', async () => {
    const instances = installIntersectionObserverMock()
    const firstLoad = createDeferred()
    const secondLoad = createDeferred()
    const onFirstLoad = vi.fn(() => firstLoad.promise)
    const onSecondLoad = vi.fn(() => secondLoad.promise)
    const { rerender } = render(<InfiniteScrollHarness operationKey="first" onLoadMore={onFirstLoad} />)

    expect(instances).toHaveLength(1)
    const firstObserver = getObserverInstance(instances, 0)
    await intersect(firstObserver)
    expect(onFirstLoad).toHaveBeenCalledTimes(1)

    rerender(<InfiniteScrollHarness operationKey="second" onLoadMore={onSecondLoad} />)

    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1)
    expect(instances).toHaveLength(2)
    const secondObserver = getObserverInstance(instances, 1)
    await intersect(secondObserver)
    expect(onSecondLoad).toHaveBeenCalledTimes(1)

    await settleDeferred(firstLoad)
    await intersect(secondObserver)
    expect(onSecondLoad).toHaveBeenCalledTimes(1)

    await settleDeferred(secondLoad)
    await intersect(secondObserver)
    expect(onSecondLoad).toHaveBeenCalledTimes(2)
  })
})

describe('useInfiniteScroll compatibility fallback', () => {
  let triggerTop: number

  beforeEach(() => {
    triggerTop = 700
    vi.stubGlobal('IntersectionObserver', undefined)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, triggerTop, 1, 1))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads immediately when the trigger is inside the fallback root margin', async () => {
    const onLoadMore = vi.fn()

    render(<InfiniteScrollHarness onLoadMore={onLoadMore} />)

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1))
  })

  it('responds to viewport changes and guards concurrent loads until the promise settles', async () => {
    triggerTop = 900
    const firstLoad = createDeferred()
    const onLoadMore = vi
      .fn()
      .mockImplementationOnce(() => firstLoad.promise)
      .mockResolvedValue(undefined)

    render(<InfiniteScrollHarness onLoadMore={onLoadMore} />)
    expect(onLoadMore).not.toHaveBeenCalled()

    triggerTop = 700
    fireEvent.resize(window)
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1))

    fireEvent.scroll(window)
    fireEvent.resize(window)
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    await act(async () => {
      firstLoad.resolve()
      await firstLoad.promise
      await Promise.resolve()
    })

    fireEvent.scroll(window)
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(2))
  })

  it('checks a replacement operation immediately without inheriting the previous fallback lock', async () => {
    const firstLoad = createDeferred()
    const secondLoad = createDeferred()
    const onFirstLoad = vi.fn(() => firstLoad.promise)
    const onSecondLoad = vi.fn(() => secondLoad.promise)
    const { rerender } = render(<InfiniteScrollHarness operationKey="first" onLoadMore={onFirstLoad} />)

    await waitFor(() => expect(onFirstLoad).toHaveBeenCalledTimes(1))

    rerender(<InfiniteScrollHarness operationKey="second" onLoadMore={onSecondLoad} />)
    await waitFor(() => expect(onSecondLoad).toHaveBeenCalledTimes(1))

    await settleDeferred(firstLoad)
    fireEvent.scroll(window)
    await act(async () => {
      await Promise.resolve()
    })
    expect(onSecondLoad).toHaveBeenCalledTimes(1)

    await settleDeferred(secondLoad)
    fireEvent.scroll(window)
    await waitFor(() => expect(onSecondLoad).toHaveBeenCalledTimes(2))
  })

  it('removes fallback listeners when the hook unmounts', async () => {
    triggerTop = 900
    const onLoadMore = vi.fn()
    const { unmount } = render(<InfiniteScrollHarness onLoadMore={onLoadMore} />)

    unmount()
    triggerTop = 700
    fireEvent.scroll(window)
    fireEvent.resize(window)

    await act(async () => {
      await Promise.resolve()
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })
})
