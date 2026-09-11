import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '@/modules/users/notifications/locale/en.json'
import ar from '@/modules/users/notifications/locale/ar.json'
import { NotificationCenterTemplate, type NotificationCenterTemplateProps } from './NotificationCenterTemplate'
import NotificationDetailsPage from './NotificationDetailsPage'
import type { NotificationItem } from './types'

vi.mock('@/modules/shared/push-notifications/components/PushNotificationPermissionControl', () => ({
  PushNotificationPermissionControl: () => null,
}))

const notification: NotificationItem = {
  id: 'message-1',
  type: 'message',
  is_read: false,
  created_at: '2026-09-08T11:30:00+03:00',
  data: { title: { en: 'Title', ar: 'عنوان' }, body: { en: 'Full message content', ar: 'محتوى الرسالة الكامل' } },
}
let height = 120
let callbacks: Array<ResizeObserverCallback> = []
const observed = new Set<Element>()
const onRead = vi.fn()

beforeEach(() => {
  height = 120
  callbacks = []
  observed.clear()
  onRead.mockClear()
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('line-clamp-4') ? height : 0
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(96)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }
      observe(element: Element) {
        observed.add(element)
      }
      unobserve(element: Element) {
        observed.delete(element)
      }
      disconnect() {
        observed.clear()
      }
    }
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function mount({
  portal = 'user',
  language = 'en',
  item = notification,
  state,
  details = false,
  items,
}: {
  portal?: string
  language?: string
  item?: NotificationItem
  state?: unknown
  details?: boolean
  items?: NotificationItem[]
} = {}) {
  const i18n = createInstance()
  await i18n.init({
    lng: language,
    fallbackLng: false,
    resources: { en: { translation: en }, ar: { translation: ar } },
  })
  const props: NotificationCenterTemplateProps = {
    activeType: 'all',
    notificationTypes: [],
    unreadOnly: false,
    notifications: items ?? [item],
    unreadCount: 1,
    isInitialLoading: false,
    isInitialError: false,
    isFetchingNextPage: false,
    isNextPageError: false,
    isReadAllPending: false,
    triggerRef: vi.fn(),
    onUnreadChange: vi.fn(),
    onReadAll: vi.fn(),
    onNotificationSelect: onRead,
    onRetryInitial: vi.fn(),
    onRetryNextPage: vi.fn(),
    useTeacherPortalLayout: portal === 'teacher',
  }
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[{ pathname: `/${portal}/notifications${details ? '/message-1' : ''}`, state }]}>
        <Routes>
          <Route
            path="/:portal/notifications"
            element={details ? <p>List fallback</p> : <NotificationCenterTemplate {...props} />}
          />
          <Route path="/:portal/notifications/:notificationId" element={<NotificationDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}

describe('message details flow', () => {
  it('renders valid client data without any HTTP request or read mutation', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'open')
    await mount({
      details: true,
      state: { notification, bodyWasOverflowing: true, listPath: '/user/notifications' },
    })
    expect(screen.getByText('Full message content')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
    expect(onRead).not.toHaveBeenCalled()
  })
  it.each([72, 96])('does not offer details when rendered height is %s', async (value) => {
    height = value
    await mount()
    expect(screen.queryByRole('link', { name: 'Read More' })).not.toBeInTheDocument()
  })
  it('leaves long non-message notifications unchanged', async () => {
    const { container } = await mount({ item: { ...notification, type: 'announcement' } })
    expect(screen.queryByRole('link', { name: 'Read More' })).not.toBeInTheDocument()
    expect(container.querySelector('.line-clamp-4')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Title' }))
    expect(onRead).toHaveBeenCalledTimes(1)
  })
  it.each(['user', 'teacher'])(
    'opens full content in the %s portal and invokes the existing read handler once',
    async (portal) => {
      const { container } = await mount({ portal })
      expect(container.querySelector('.line-clamp-4')).not.toBeNull()
      const link = screen.getByRole('link', { name: 'Read More' })
      expect(link).toHaveAttribute('href', `/${portal}/notifications/message-1`)
      expect(link.closest('button')).toBeNull()
      link.focus()
      await userEvent.keyboard('{Enter}')
      expect(onRead).toHaveBeenCalledExactlyOnceWith('message-1')
      expect(screen.getByRole('heading', { name: 'Notification Details' })).toBeInTheDocument()
      expect(screen.getByText('Full message content')).toBeInTheDocument()
      expect(container.querySelector('.line-clamp-4')).toBeNull()
    }
  )
  it('does not mark an already-read message again', async () => {
    await mount({ item: { ...notification, is_read: true } })
    await userEvent.click(screen.getByRole('link', { name: 'Read More' }))
    expect(onRead).not.toHaveBeenCalled()
  })
  it('updates on width changes with one observer and cleans up', async () => {
    const view = await mount({ items: [notification, { ...notification, id: 'message-2' }] })
    expect(callbacks).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: 'Read More' })).toHaveLength(2)
    height = 72
    act(() =>
      callbacks[0](
        Array.from(observed, (target) => ({ target }) as ResizeObserverEntry),
        {} as ResizeObserver
      )
    )
    expect(screen.queryByRole('link', { name: 'Read More' })).not.toBeInTheDocument()
    view.unmount()
    expect(observed.size).toBe(0)
  })
  it('uses Arabic action and RTL details', async () => {
    await mount({ language: 'ar' })
    await userEvent.click(screen.getByRole('link', { name: ar.notifications.actions.read_more }))
    expect(screen.getByRole('region', { name: ar.notifications.details_title })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByText(notification.data.body.ar!)).toBeInTheDocument()
  })
  it.each([
    undefined,
    { notification, bodyWasOverflowing: false, listPath: '/user/notifications' },
    { notification: { ...notification, type: 'exam' }, bodyWasOverflowing: true, listPath: '/user/notifications' },
    { notification: { ...notification, id: 'other' }, bodyWasOverflowing: true, listPath: '/user/notifications' },
    { notification, bodyWasOverflowing: true, listPath: '/teacher/notifications' },
    { notification: {}, bodyWasOverflowing: true, listPath: '/user/notifications' },
  ])('rejects unavailable or ineligible details state without a request: %j', async (state) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const xhr = vi.spyOn(XMLHttpRequest.prototype, 'open')
    await mount({ details: true, state })
    expect(screen.getByText('List fallback')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Notification Details' })).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    expect(xhr).not.toHaveBeenCalled()
  })
})
