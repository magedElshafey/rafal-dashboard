import { useTranslation } from 'react-i18next'
import { PortalLink } from '@/components/core/portal-link/components/PortalLink'
import { usePortalPath } from '@/components/core/portal-link/hooks/usePortalPath'
import { SafeHtmlContent } from '@/components/shared/safe-html/SafeHtmlContent'
import type { NotificationItem } from './types'
import { cn } from '@/lib/utils'
import type { MessageDetailsContent } from './message-details.types'
import { useMessageOverflow } from './useMessageOverflow'

type MessageBodyProps = {
  body: string
  variant?: 'default' | 'compact'
  className?: string
} & (
  | { notification: NotificationItem; onRead: () => void; content?: never }
  | { content: MessageDetailsContent; notification?: never; onRead?: never }
)

export function NotificationMessageBody({ notification, content, body, onRead, variant, className }: MessageBodyProps) {
  const { t } = useTranslation()
  const { ref, overflowing } = useMessageOverflow(body)
  const listPath = usePortalPath('/notifications')
  return (
    <>
      <div ref={ref} className="mt-1 min-w-0">
        <SafeHtmlContent
          html={body}
          variant={variant}
          className={cn(
            'line-clamp-4 text-sm leading-6 text-content-secondary [overflow-wrap:anywhere] [&_a]:relative [&_a]:z-20',
            className
          )}
        />
      </div>
      {overflowing && (
        <PortalLink
          to={notification ? `/notifications/${encodeURIComponent(notification.id)}` : '/home/announcement'}
          state={
            notification
              ? { notification, bodyWasOverflowing: true, listPath }
              : { source: 'home-announcements', content, bodyWasOverflowing: true, listPath }
          }
          onClick={(event) => {
            event.stopPropagation()
            onRead?.()
          }}
          className="relative z-20 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('notifications.actions.read_more')}
        </PortalLink>
      )}
    </>
  )
}
