import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import en from '@/modules/users/notifications/locale/en.json'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppRole } from '@/modules/auth/types/auth.types'
import { NotificationsTemplate } from '@/modules/users/notifications/components/templates/NotificationsTemplate'
import { UserNotificationCard } from '@/modules/users/notifications/components/molecules/UserNotificationCard'
import TeacherNotificationsPage from '@/modules/teachers/shared/notifications/page/TeacherNotificationsPage'
import { getNotificationDestination } from './notifications.helpers'
import type { NotificationItem } from './types'

const state = vi.hoisted(() => ({ role: 'student' as AppRole, markAsRead: vi.fn(), items: [] as NotificationItem[] }))
const i18n = createInstance()
vi.mock('@/store/auth', () => ({ useAuth: (selector: (value: { role: AppRole }) => unknown) => selector(state) }))
vi.mock('@/modules/shared/push-notifications/components/PushNotificationPermissionControl', () => ({
  PushNotificationPermissionControl: () => null,
}))
vi.mock('@/modules/users/notifications/hooks/useMarkNotificationAsRead', () => ({
  useMarkNotificationAsRead: () => ({ markAsRead: state.markAsRead, isPending: false }),
}))
vi.mock('@/modules/teachers/shared/notifications/hooks/useTeacherNotificationMutations', () => ({
  useMarkTeacherNotificationAsRead: () => ({ markAsRead: state.markAsRead, isPending: false }),
  useMarkAllTeacherNotificationsAsRead: () => ({ markAll: vi.fn(), isPending: false }),
}))
vi.mock('@/modules/teachers/shared/notifications/hooks/useTeacherNotifications', () => ({
  useTeacherNotifications: () => ({ notifications: state.items, data: { pages: [] }, unreadCount: 1 }),
  useTeacherUnreadNotificationCount: () => ({ unreadCount: 1 }),
}))
vi.mock('@/hooks/ddl/notification-types/useNotificationTypesDdl', () => ({
  useNotificationTypesDdl: () => ({ data: [], isSuccess: true }),
}))
vi.mock('@/hooks/queries/useInfiniteScroll', () => ({ useInfiniteScroll: () => null }))

function LocationProbe() {
  return <output aria-label="location">{useLocation().pathname}</output>
}

function mount(role: AppRole, type: string, legacy = false, isRead = false) {
  state.role = role
  const item: NotificationItem = {
    id: 'notification-1',
    type,
    is_read: isRead,
    created_at: '2026-09-09T10:00:00Z',
    data: { title: { en: 'Notification title', ar: 'عنوان' }, body: { en: 'Body', ar: 'نص' } },
  }
  state.items = [item]
  const portal = role === 'student' || role === 'parent' ? 'user' : 'teacher'
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter
        initialEntries={[`/${portal}/notifications`]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {legacy ? (
          <UserNotificationCard notification={item} />
        ) : portal === 'teacher' ? (
          <TeacherNotificationsPage />
        ) : (
          <NotificationsTemplate
            activeType="all"
            notificationTypes={[]}
            unreadOnly={false}
            notifications={[item]}
            unreadCount={1}
            isInitialLoading={false}
            isInitialError={false}
            isFetchingNextPage={false}
            isNextPageError={false}
            isReadAllPending={false}
            triggerRef={null}
            onUnreadChange={vi.fn()}
            onReadAll={vi.fn()}
            onRetryInitial={vi.fn()}
            onRetryNextPage={vi.fn()}
          />
        )}
        <LocationProbe />
      </MemoryRouter>
    </I18nextProvider>
  )
  return portal
}

const matrix: Array<[AppRole, string, string | null]> = [
  ['student', 'assignment', '/assignments'],
  ['student', 'exam', '/exams'],
  ['student', 'session', '/sessions'],
  ['parent', 'assignment', '/assignments'],
  ['parent', 'exam', '/exams'],
  ['parent', 'session', null],
  ['admin', 'exam', '/exams'],
  ['admin', 'assignment', '/assignments'],
  ['admin', 'session', '/sessions'],
  ['admin', 'report', '/reports-center'],
  ['assistant', 'exam', '/exams'],
  ['assistant', 'assignment', '/assignments'],
  ['assistant', 'session', '/sessions'],
  ['assistant', 'report', '/reports-center'],
  ['teacher', 'exam', '/exams'],
  ['teacher', 'assignment', '/assignments'],
  ['teacher', 'session', '/sessions'],
  ['teacher', 'report', null],
]

describe('notification destination wiring', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.init({ lng: 'en', fallbackLng: false, resources: { en: { translation: en } } })
  })
  it.each(matrix)('%s + %s resolves to %s and preserves read behavior', async (role, type, destination) => {
    expect(getNotificationDestination(type, role)).toBe(destination)
    const portal = mount(role, type)
    const article = within(screen.getByRole('article'))
    if (destination) {
      const link = article.getByRole('link')
      expect(link).toHaveAttribute('href', `/${portal}${destination}`)
      await userEvent.click(link)
      expect(screen.getByLabelText('location')).toHaveTextContent(`/${portal}${destination}`)
    } else {
      expect(article.queryByRole('link')).not.toBeInTheDocument()
      const button = article.getByRole('button')
      button.focus()
      await userEvent.keyboard('{Enter}')
      expect(screen.getByLabelText('location')).toHaveTextContent(`/${portal}/notifications`)
    }
    expect(state.markAsRead).toHaveBeenCalledExactlyOnceWith('notification-1')
  })
  it('also prevents Parent session navigation in the standalone User card', async () => {
    mount('parent', 'session', true)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByLabelText('location')).toHaveTextContent('/user/notifications')
    expect(state.markAsRead).toHaveBeenCalledExactlyOnceWith('notification-1')
  })
  it.each<[AppRole, string]>([
    ['parent', 'session'],
    ['teacher', 'report'],
  ])('keeps read %s %s display-only', (role, type) => {
    mount(role, type, false, true)
    const article = within(screen.getByRole('article'))
    expect(article.queryByRole('link')).not.toBeInTheDocument()
    expect(article.queryByRole('button')).not.toBeInTheDocument()
    expect(state.markAsRead).not.toHaveBeenCalled()
  })
  it.each<AppRole>(['student', 'parent', 'admin', 'assistant', 'teacher'])(
    'leaves %s messages and unsupported types to existing behavior',
    (role) => {
      for (const type of ['message', 'future-type', 'announcement', 'toString']) {
        expect(getNotificationDestination(type, role)).toBeNull()
      }
    }
  )
})
