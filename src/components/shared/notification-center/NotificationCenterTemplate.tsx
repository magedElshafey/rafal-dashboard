import { NotificationMessageBody } from '@/components/shared/notification-center/NotificationMessageBody'
import { memo, useId, useMemo, type ReactNode, type Ref } from 'react'
import { CheckCheck, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Container } from '@/components/core/Container'
import { PortalLink } from '@/components/core/portal-link/components/PortalLink'
import { Section } from '@/components/core/Section'
import { SafeHtmlContent } from '@/components/shared/safe-html/SafeHtmlContent'
import { getBaseTabId } from '@/components/shared/tabs/BaseTabs'
import { QueryTabsFilter } from '@/components/shared/tabs/QueryTabsFilter'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getDateDisplayAttributes, resolveAppLocale } from '@/utils/date/date.helpers'
import {
  getLocalizedNotificationText,
  getNotificationTypeLabelKey,
  normalizeNotificationTypeOptions,
} from './notifications.helpers'
import { groupNotificationsByDate } from './notification-grouping.helpers'
import type { NotificationItem, NotificationListType } from './types'
import { StatusBadge } from '@/components/shared/dashboard/atoms/StatusBadge'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { PushNotificationPermissionControl } from '@/modules/shared/push-notifications/components/PushNotificationPermissionControl'

const TABS_ID = 'notifications-filter-tabs'
const PANEL_ID = 'notifications-panel'

export type NotificationCenterTemplateProps = {
  activeType: NotificationListType
  notificationTypes: readonly IDDl[]
  unreadOnly: boolean
  notifications: readonly NotificationItem[]
  unreadCount: number
  isInitialLoading: boolean
  isInitialError: boolean
  isFetchingNextPage: boolean
  isNextPageError: boolean
  isReadAllPending: boolean
  triggerRef: Ref<HTMLDivElement>
  onUnreadChange: (checked: boolean) => void
  onReadAll: () => void
  onNotificationSelect: (id: EntityId) => void
  onRetryInitial: () => void
  onRetryNextPage: () => void
  resolveDestination?: (type: string) => string | null
  isNotificationReadPending?: boolean
  useTeacherPortalLayout?: boolean
  statistics?: ReactNode
}

const NotificationCard = memo(function NotificationCard({
  notification,
  onSelect,
  resolveDestination,
  isPending = false,
}: {
  notification: NotificationItem
  onSelect: (id: EntityId) => void
  resolveDestination?: (type: string) => string | null
  isPending?: boolean
}) {
  const { t, i18n } = useTranslation()
  const generatedId = useId()
  const titleId = `notification-title-${generatedId}`
  const unreadStateId = `notification-unread-${generatedId}`
  const locale = resolveAppLocale(i18n.language)
  const title = getLocalizedNotificationText(
    notification.data.title,
    i18n.language,
    t('notifications.content.title_unavailable')
  )
  const body = getLocalizedNotificationText(
    notification.data.body,
    i18n.language,
    t('notifications.content.body_unavailable')
  )
  const destination = resolveDestination?.(notification.type) ?? null
  const handleRead = () => {
    if (!notification.is_read) onSelect(notification.id)
  }
  const interactionClassName = cn(
    'rounded-sm focus-visible:outline-none',
    'after:absolute after:inset-0 after:z-10 after:rounded-xl',
    'focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2'
  )
  return (
    <article
      aria-labelledby={titleId}
      aria-describedby={!notification.is_read ? unreadStateId : undefined}
      className={cn(
        'relative min-w-0 rounded-xl border border-border-subtle bg-surface-card px-4 py-4 md:px-5',
        (destination || !notification.is_read) && 'cursor-pointer transition-colors hover:bg-surface-page'
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h3 id={titleId} className="min-w-0 break-words text-base font-semibold leading-6 text-content-primary">
          {destination ? (
            <PortalLink
              to={destination}
              onClick={handleRead}
              aria-describedby={!notification.is_read ? unreadStateId : undefined}
              aria-busy={!notification.is_read && isPending ? true : undefined}
              className={interactionClassName}
            >
              {title}
            </PortalLink>
          ) : !notification.is_read ? (
            <button
              type="button"
              onClick={handleRead}
              aria-describedby={unreadStateId}
              aria-busy={isPending ? true : undefined}
              className={cn(interactionClassName, 'text-start')}
            >
              {title}
            </button>
          ) : (
            title
          )}
        </h3>
        {!notification.is_read && (
          <span
            id={unreadStateId}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-xs font-medium leading-none text-success-600"
          >
            <span className="size-1.5 rounded-full bg-success-500" aria-hidden />
            {t('notifications.badges.new')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 my-3">
        <StatusBadge>{notification.type}</StatusBadge>
        {notification.sender && <StatusBadge variant="success">{notification.sender.role}</StatusBadge>}
      </div>
      {notification.type === 'message' ? (
        <NotificationMessageBody notification={notification} body={body} onRead={handleRead} />
      ) : (
        <SafeHtmlContent
          html={body}
          className="mt-1 min-w-0 break-words text-sm leading-6 text-content-secondary [&_a]:relative [&_a]:z-20"
        />
      )}
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs leading-5 text-content-tertiary">
        {formatRelativeTime(notification.created_at, { locale }) ? (
          <time dateTime={notification.created_at} {...getDateDisplayAttributes(locale)}>
            {formatRelativeTime(notification.created_at, { locale })}
          </time>
        ) : (
          <span>{t('notifications.content.date_unavailable')}</span>
        )}
        <span aria-hidden>•</span>
        <span>{t(getNotificationTypeLabelKey(notification.type))}</span>
      </p>
    </article>
  )
})

function LoadingState({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">
        {t(compact ? 'notifications.states.loading_more' : 'notifications.states.loading')}
      </span>
      <div aria-hidden className="space-y-3">
        {Array.from({ length: compact ? 1 : 3 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border-subtle bg-surface-card px-4 py-4 md:px-5">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-4/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Timeline(props: NotificationCenterTemplateProps) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const groups = useMemo(() => groupNotificationsByDate(props.notifications, { locale }), [locale, props.notifications])
  if (props.isInitialLoading) return <LoadingState />
  if (props.isInitialError)
    return (
      <div role="alert" className="rounded-xl border border-error-200 bg-surface-card px-5 py-10 text-center">
        <p className="text-base font-semibold text-content-primary">{t('notifications.states.error_title')}</p>
        <p className="mt-1 text-sm text-content-secondary">{t('notifications.states.error_description')}</p>
        <Button type="button" variant="outline" onClick={props.onRetryInitial} className="mt-5 normal-case">
          {t('notifications.actions.retry')}
        </Button>
      </div>
    )
  if (props.notifications.length === 0) {
    const emptyKey = props.unreadOnly
      ? props.activeType === 'assignment'
        ? 'notifications.states.empty_unread_assignments'
        : props.activeType === 'exam'
          ? 'notifications.states.empty_unread_exams'
          : 'notifications.states.empty_unread'
      : props.activeType === 'assignment'
        ? 'notifications.states.empty_assignments'
        : props.activeType === 'exam'
          ? 'notifications.states.empty_exams'
          : 'notifications.states.empty_all'

    return (
      <div className="rounded-xl border border-border-subtle bg-surface-card px-5 py-12 text-center">
        <p className="text-base font-semibold text-content-primary">{t('notifications.states.empty_title')}</p>
        <p className="mt-1 text-sm text-content-secondary">{t(emptyKey)}</p>
      </div>
    )
  }
  return (
    <div role="region" aria-label={t('notifications.timeline_label')} className="min-w-0 space-y-6">
      {groups.map((group, index) => {
        const headingId = `notification-group-${group.key}`
        const title =
          group.kind === 'today'
            ? t('notifications.groups.today')
            : group.kind === 'yesterday'
              ? t('notifications.groups.yesterday')
              : group.kind === 'unknown'
                ? t('notifications.groups.unknown_date')
                : group.label
        return (
          <section
            key={group.key}
            aria-labelledby={headingId}
            className={index === 0 ? 'space-y-2.5' : 'space-y-2.5 border-t border-border-subtle pt-5'}
          >
            <h2 id={headingId} className="text-sm font-semibold text-content-primary">
              {title}
            </h2>
            <div className="space-y-2.5">
              {group.items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onSelect={props.onNotificationSelect}
                  resolveDestination={props.resolveDestination}
                  isPending={props.isNotificationReadPending}
                />
              ))}
            </div>
          </section>
        )
      })}
      <div ref={props.triggerRef} className="h-px" aria-hidden />
      {props.isFetchingNextPage && <LoadingState compact />}
      {props.isNextPageError && (
        <div role="alert" className="rounded-xl border border-error-200 bg-surface-card px-5 py-6 text-center">
          <p className="text-sm text-content-secondary">{t('notifications.states.load_more_error')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onRetryNextPage}
            className="mt-3 normal-case"
          >
            {t('notifications.actions.retry')}
          </Button>
        </div>
      )}
    </div>
  )
}

export function NotificationCenterTemplate(props: NotificationCenterTemplateProps) {
  const { t } = useTranslation()
  const tabs = useMemo(
    () => [
      { value: 'all', label: t('notifications.tabs.all') },
      ...normalizeNotificationTypeOptions(props.notificationTypes),
    ],
    [props.notificationTypes, t]
  )
  const content = (
    <>
      {!props.useTeacherPortalLayout && (
        <Breadcrumb aria-label={t('notifications.breadcrumb_label')}>
          <BreadcrumbList className="text-content-secondary">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <PortalLink to="/home">{t('notifications.home')}</PortalLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-content-primary">{t('notifications.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      {props.useTeacherPortalLayout ? (
        <DashboardPageHeader titleId="notifications-title" title={t('notifications.title')} />
      ) : (
        <h1 id="notifications-title" className="text-2xl font-semibold leading-8 text-content-heavy md:text-3xl">
          {t('notifications.title')}
        </h1>
      )}
      <div className="flex justify-end">
        <PushNotificationPermissionControl />
      </div>
      {props.statistics}

      <QueryTabsFilter
        id={TABS_ID}
        panelId={PANEL_ID}
        name="type"
        tabs={tabs}
        value={props.activeType}
        defaultValue="all"
        clearValue="all"
        fullWidth
        ariaLabel={t('notifications.tabs.label')}
        tabClassName="text-[11px] sm:text-sm [&>span]:break-normal [&>span]:whitespace-nowrap"
      />
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <label
          htmlFor="notifications-unread-filter"
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md text-sm text-content-secondary focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
        >
          <Checkbox
            id="notifications-unread-filter"
            checked={props.unreadOnly}
            onCheckedChange={(checked) => props.onUnreadChange(checked === true)}
            aria-label={t('notifications.filters.unread')}
          />
          <span>{t('notifications.filters.unread')}</span>
        </label>
        <Button
          type="button"
          variant="ghost"
          disabled={props.unreadCount === 0 || props.isReadAllPending}
          aria-busy={props.isReadAllPending}
          onClick={props.onReadAll}
          className="min-h-11 min-w-40 justify-end px-2 normal-case text-content-secondary hover:text-brand-500"
        >
          {props.isReadAllPending ? (
            <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
          ) : (
            <CheckCheck className="size-4" aria-hidden />
          )}
          {t(
            props.isReadAllPending
              ? 'notifications.actions.marking_all_as_read'
              : 'notifications.actions.mark_all_as_read'
          )}
        </Button>
      </div>
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={getBaseTabId(TABS_ID, props.activeType)}
        tabIndex={0}
        className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
      >
        <Timeline {...props} />
      </div>
    </>
  )

  if (props.useTeacherPortalLayout) {
    return (
      <section aria-labelledby="notifications-title" className="space-y-6">
        {content}
      </section>
    )
  }

  return (
    <Section aria-labelledby="notifications-title">
      <Container className="space-y-7 md:space-y-8">{content}</Container>
    </Section>
  )
}
