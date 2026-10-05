import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/utils/date/date.helpers'
import type { ContactMessage } from '../types/contact-message.types'

export function ContactMessageText({ value }: { value: string | null }) {
  const { t } = useTranslation()
  return <bdi>{value?.trim() ? value : t('contactMessages.unavailable')}</bdi>
}
export function ContactMessageStatusBadge({ message }: { message: ContactMessage }) {
  const { t } = useTranslation()
  const status = message.status
  const known = status === 'new' || status === 'read' || status === 'resolved'
  const label = known
    ? t(`contactMessages.status.${status}`)
    : message.statusLabel.trim() || status.replace(/[_-]+/g, ' ').trim() || t('contactMessages.unavailable')
  return (
    <Badge
      variant={
        status === 'new' ? 'warning' : status === 'resolved' ? 'success' : status === 'read' ? 'secondary' : 'outline'
      }
    >
      <bdi>{label}</bdi>
    </Badge>
  )
}
export function ContactMessageAccount({ user }: { user: ContactMessage['user'] }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1 whitespace-normal break-words">
      <p>{t(user ? 'contactMessages.registered' : 'contactMessages.guest')}</p>
      {user ? (
        <>
          <p>
            <ContactMessageText value={[user.firstName, user.lastName].filter((value) => value.trim()).join(' ')} />
          </p>
          <p className="break-all">
            <ContactMessageText value={user.email} />
          </p>
        </>
      ) : null}
    </div>
  )
}
export function ContactMessageDate({ value }: { value: string }) {
  const { t, i18n } = useTranslation()
  return (
    <time dateTime={value}>
      {formatDateTime(value, { locale: i18n.language.startsWith('ar') ? 'ar' : 'en' }) ||
        t('contactMessages.unavailable')}
    </time>
  )
}
