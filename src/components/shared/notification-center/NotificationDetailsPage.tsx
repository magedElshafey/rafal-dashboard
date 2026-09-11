import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/core/Container'
import { Section } from '@/components/core/Section'
import { usePortalPath } from '@/components/core/portal-link/hooks/usePortalPath'
import { SafeHtmlContent } from '@/components/shared/safe-html/SafeHtmlContent'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'
import { getLocalizedNotificationText } from './notifications.helpers'
import type { NotificationItem } from './types'
import type { MessageDetailsContent } from './message-details.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLocalizedText(value: unknown) {
  return (
    isRecord(value) &&
    (typeof value.en === 'string' || value.en === null) &&
    (typeof value.ar === 'string' || value.ar === null)
  )
}

function isMessage(value: unknown): value is NotificationItem {
  return (
    isRecord(value) &&
    value.type === 'message' &&
    typeof value.id === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.is_read === 'boolean' &&
    isRecord(value.data) &&
    isLocalizedText(value.data.title) &&
    isLocalizedText(value.data.body)
  )
}

function isDetailsContent(value: unknown): value is MessageDetailsContent {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.sender === undefined ||
      (isRecord(value.sender) && typeof value.sender.name === 'string' && typeof value.sender.role === 'string'))
  )
}

export default function NotificationDetailsPage() {
  const { state, pathname }: { state: unknown; pathname: string } = useLocation()
  const { notificationId } = useParams()
  const listPath = usePortalPath('/notifications')
  const homeDetailsPath = usePortalPath('/home/announcement')
  const { t, i18n } = useTranslation()
  // Keep source eligibility separate from the shared presentation. Neither branch fetches data.
  let content: MessageDetailsContent | undefined
  if (isRecord(state) && state.bodyWasOverflowing === true && state.listPath === listPath) {
    if (notificationId && isMessage(state.notification) && state.notification.id === notificationId) {
      const notification = state.notification
      content = {
        title: getLocalizedNotificationText(
          notification.data.title,
          i18n.language,
          t('notifications.content.title_unavailable')
        ),
        body: getLocalizedNotificationText(
          notification.data.body,
          i18n.language,
          t('notifications.content.body_unavailable')
        ),
        createdAt: notification.created_at,
      }
    } else if (
      !notificationId &&
      pathname === homeDetailsPath &&
      state.source === 'home-announcements' &&
      isDetailsContent(state.content)
    ) {
      content = state.content
    }
  }
  if (!content) return <Navigate to={listPath} replace />
  return (
    <Section aria-labelledby="notification-details-title" dir={i18n.dir()}>
      <Container className="space-y-6">
        <h1 id="notification-details-title" className="text-2xl font-semibold text-content-heavy md:text-3xl">
          {t('notifications.details_title')}
        </h1>
        <article className="min-w-0 space-y-6 rounded-xl border border-border-subtle bg-surface-card p-5 sm:p-8">
          <header className="space-y-2 border-b border-border-subtle pb-5">
            <h2 className="break-words text-xl font-semibold text-content-primary [overflow-wrap:anywhere]" dir="auto">
              {content.title}
            </h2>
            <p className="text-sm text-content-tertiary">
              {formatDateTime(content.createdAt, { locale: resolveAppLocale(i18n.language) })}
            </p>
            {content.sender && (
              <p className="text-sm text-content-secondary" dir="auto">
                {content.sender.name}
              </p>
            )}
          </header>
          <SafeHtmlContent
            html={content.body}
            className="text-sm leading-6 [overflow-wrap:anywhere] sm:text-base sm:leading-7"
          />
        </article>
      </Container>
    </Section>
  )
}
